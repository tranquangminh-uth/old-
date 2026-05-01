// SECOND-HAND MARKETPLACE — Node.js Database Layer
// Thư viện: pg (node-postgres)

const { Pool } = require("pg");

// 1. KẾT NỐI DATABASE

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "secondhand_db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "yourpassword",
  max: 20, // Tối đa 20 kết nối trong pool
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2_000,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: true }
      : false,
});

// Kiểm tra kết nối khi khởi động
pool.on("connect", () => {
  console.log("✅ PostgreSQL connected");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL pool error:", err.message);
});
/**
 * Lấy danh sách sản phẩm đang bán (available), kèm:
 *   - Tên & avatar người bán
 *   - Tên danh mục
 *   - Ảnh chính của sản phẩm
 *
 * @param {{ categoryId?: number, condition?: string, minPrice?: number,
 *            maxPrice?: number, search?: string, limit?: number, offset?: number }} filters
 * @returns {Promise<Array>}
 */
async function getProducts(filters = {}) {
  const {
    categoryId,
    condition,
    minPrice,
    maxPrice,
    search,
    limit = 20,
    offset = 0,
  } = filters;

  // Tập hợp điều kiện WHERE động (tránh SQL injection bằng parameterized query)
  const conditions = [`p.status = 'available'`];
  const params = [];

  if (categoryId) {
    params.push(categoryId);
    conditions.push(`p.category_id = $${params.length}`);
  }
  if (condition) {
    params.push(condition);
    conditions.push(`p.condition = $${params.length}`);
  }
  if (minPrice != null) {
    params.push(minPrice);
    conditions.push(`p.price >= $${params.length}`);
  }
  if (maxPrice != null) {
    params.push(maxPrice);
    conditions.push(`p.price <= $${params.length}`);
  }
  if (search) {
    params.push(search);
    // Tìm kiếm full-text với tiếng Việt (simple dictionary)
    conditions.push(
      `to_tsvector('simple', p.title || ' ' || COALESCE(p.description, ''))
       @@ plainto_tsquery('simple', $${params.length})`,
    );
  }

  params.push(limit, offset);
  const limitParam = params.length - 1;
  const offsetParam = params.length;

  const sql = `
    SELECT
      -- Thông tin sản phẩm
      p.id              AS product_id,
      p.title,
      p.description,
      p.price,
      p.condition,
      p.status,
      p.location,
      p.view_count,
      p.created_at      AS listed_at,

      -- Thông tin người bán (JOIN users)
      u.id              AS seller_id,
      u.full_name       AS seller_name,
      u.phone           AS seller_phone,
      u.avatar_url      AS seller_avatar,
      u.is_verified     AS seller_verified,

      -- Đánh giá trung bình người bán (subquery)
      (
        SELECT ROUND(AVG(r.rating)::NUMERIC, 1)
        FROM   reviews r
        WHERE  r.reviewee_id = u.id
      )                 AS seller_avg_rating,

      -- Tên danh mục (JOIN categories)
      c.name            AS category_name,
      c.slug            AS category_slug,

      -- Ảnh chính (LEFT JOIN để không mất sản phẩm chưa có ảnh)
      img.image_url     AS primary_image_url

    FROM   products p
    INNER JOIN users          u   ON u.id  = p.seller_id
    INNER JOIN categories     c   ON c.id  = p.category_id
    LEFT  JOIN product_images img ON img.product_id = p.id
                                 AND img.is_primary  = TRUE

    WHERE  ${conditions.join(" AND ")}
    ORDER  BY p.created_at DESC
    LIMIT  $${limitParam}
    OFFSET $${offsetParam}
  `;

  const { rows } = await pool.query(sql, params);
  return rows;
}

// 3. QUERY MẪU: Lấy chi tiết 1 sản phẩm (kèm tất cả ảnh)

async function getProductById(productId) {
  const sql = `
    SELECT
      p.*,
      u.full_name       AS seller_name,
      u.avatar_url      AS seller_avatar,
      u.phone           AS seller_phone,
      u.is_verified     AS seller_verified,
      c.name            AS category_name,

      -- Gom tất cả ảnh thành JSON array
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'url',        img.image_url,
            'is_primary', img.is_primary,
            'order',      img.sort_order
          ) ORDER BY img.sort_order
        ) FILTER (WHERE img.id IS NOT NULL),
        '[]'
      ) AS images

    FROM   products       p
    INNER JOIN users          u   ON u.id  = p.seller_id
    INNER JOIN categories     c   ON c.id  = p.category_id
    LEFT  JOIN product_images img ON img.product_id = p.id

    WHERE  p.id     = $1
      AND  p.status != 'deleted'

    GROUP  BY p.id, u.id, c.id
  `;

  const { rows } = await pool.query(sql, [productId]);

  if (rows.length === 0) return null;

  // Tăng view_count bất đồng bộ (không chặn response)
  pool
    .query("UPDATE products SET view_count = view_count + 1 WHERE id = $1", [
      productId,
    ])
    .catch(console.error);

  return rows[0];
}

// 4. QUERY MẪU: Tạo đơn hàng (dùng Transaction)

/**
 * Tạo đơn hàng và cập nhật trạng thái sản phẩm thành 'reserved'
 * Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu (ACID)
 */
async function createOrder({ buyerId, productIds, shippingAddress }) {
  const client = await pool.connect(); // Lấy 1 kết nối độc lập từ pool

  try {
    await client.query("BEGIN");

    // 1. Kiểm tra & lock các sản phẩm (FOR UPDATE để tránh race condition)
    const { rows: products } = await client.query(
      `SELECT id, seller_id, price, status
       FROM   products
       WHERE  id = ANY($1::uuid[])
         AND  status = 'available'
       FOR UPDATE`,
      [productIds],
    );

    if (products.length !== productIds.length) {
      throw new Error("Một hoặc nhiều sản phẩm không còn sẵn có");
    }

    // Kiểm tra tất cả sản phẩm cùng 1 người bán (đơn hàng đơn giản)
    const sellerIds = [...new Set(products.map((p) => p.seller_id))];
    if (sellerIds.length > 1) {
      throw new Error("Không thể mua sản phẩm của nhiều người bán trong 1 đơn");
    }

    const sellerId = sellerIds[0];
    const totalPrice = products.reduce(
      (sum, p) => sum + parseFloat(p.price),
      0,
    );

    // 2. Tạo đơn hàng
    const {
      rows: [order],
    } = await client.query(
      `INSERT INTO orders (buyer_id, seller_id, total_price, shipping_address)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [buyerId, sellerId, totalPrice, shippingAddress],
    );

    // 3. Tạo order_items
    for (const product of products) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, price_snapshot)
         VALUES ($1, $2, $3)`,
        [order.id, product.id, product.price],
      );
    }

    // 4. Cập nhật trạng thái sản phẩm → reserved
    await client.query(
      `UPDATE products SET status = 'reserved'
       WHERE  id = ANY($1::uuid[])`,
      [productIds],
    );

    await client.query("COMMIT");
    return order;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err; // Ném lỗi lên tầng trên xử lý
  } finally {
    client.release(); // Luôn trả kết nối về pool
  }
}

// 5. DEMO: Chạy thử các queries

async function demo() {
  try {
    console.log("\n--- [1] Danh sách sản phẩm điện thoại ---");
    const phones = await getProducts({
      categoryId: 4, // Điện thoại
      condition: "90_percent",
      minPrice: 500_000,
      maxPrice: 5_000_000,
      limit: 5,
    });
    console.table(
      phones.map((p) => ({
        title: p.title,
        price: `${Number(p.price).toLocaleString("vi-VN")}₫`,
        condition: p.condition,
        seller: p.seller_name,
        avg_rating: p.seller_avg_rating,
        category: p.category_name,
        has_image: !!p.primary_image_url,
      })),
    );

    if (phones.length > 0) {
      console.log("\n--- [2] Chi tiết sản phẩm đầu tiên ---");
      const detail = await getProductById(phones[0].product_id);
      console.log("Tên:", detail.title);
      console.log("Mô tả:", detail.description);
      console.log("Số ảnh:", detail.images.length);
      console.log("Người bán:", detail.seller_name);
      console.log("Đã xác minh:", detail.seller_verified);
    }
  } catch (err) {
    console.error("Lỗi demo:", err.message);
  } finally {
    await pool.end();
  }
}
// 1. Kỹ năng tìm User bằng Email
const getUserByEmail = async (email) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  return result.rows[0];
};

// 2. Kỹ năng tạo User mới (Mặc định Role là 'buyer' - Người mua)
const createUser = async (email, passwordHash, fullName) => {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, role) 
         VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role`,
    [email, passwordHash, fullName, "buyer"],
  );
  return result.rows[0];
};

module.exports = {
  pool,
  getProducts,
  getProductById,
  createOrder,
  getUserByEmail,
  createUser,
};
