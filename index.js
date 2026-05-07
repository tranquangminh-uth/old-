require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  pool,
  getProducts,
  getProductById,
  createOrder,
  getUserByEmail,
  createUser,
} = require("./queries");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/products", async (req, res) => {
  try {
    const products = await getProducts();
    res.status(200).json(products);
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm:", error);
    res.status(500).json({ message: "Lỗi kết nối Database" });
  }
});

// API ĐĂNG KÝ (REGISTER) - Yêu cầu FR-G06
app.post("/api/register", async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // 1. Kiểm tra xem email đã bị ai xài chưa?
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email này đã được sử dụng!" });
    }

    // 2. Băm mật khẩu (Mã hóa 10 lớp)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Cất vào kho (Database)
    const newUser = await createUser(email, passwordHash, fullName);

    res.status(201).json({ message: "Đăng ký thành công!", user: newUser });
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    res.status(500).json({ message: "Lỗi Server cục bộ" });
  }
});

// API ĐĂNG NHẬP (LOGIN) - Yêu cầu FR-G07
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Lục kho tìm User theo Email
    const user = await getUserByEmail(email);
    if (!user) {
      return res
        .status(400)
        .json({ message: "Email hoặc mật khẩu không đúng!" });
    }

    // 2. So sánh mật khẩu nhập vào với mật khẩu đã băm trong kho
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Email hoặc mật khẩu không đúng!" });
    }

    // 3. Đúng pass rồi! Bắt đầu in Thẻ bài (JWT)
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    // Ký tên vào thẻ bài bằng khóa bí mật (lấy từ file .env), hạn dùng 1 ngày (24h)
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
      (err, token) => {
        if (err) throw err;
        res.json({
          message: "Đăng nhập thành công!",
          token: token,
          user: { id: user.id, full_name: user.full_name, role: user.role },
        });
      },
    );
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({ message: "Lỗi Server cục bộ" });
  }
});

// BẢO VỆ CỬA
const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token)
    return res
      .status(401)
      .json({ message: "Từ chối truy cập: Không có thẻ bài!" });

  try {
    // Lấy phần mã sau chữ "Bearer " và giải mã
    const decoded = jwt.verify(
      token.replace("Bearer ", ""),
      process.env.JWT_SECRET,
    );
    req.user = decoded.user; // Nhét thông tin user (gồm id) vào req để dùng
    next(); // Cho qua
  } catch (err) {
    res.status(401).json({ message: "Thẻ bài không hợp lệ hoặc đã hết hạn!" });
  }
};

// API ĐĂNG TIN SẢN PHẨM MỚI (FR-S01)
app.post("/api/products", authMiddleware, async (req, res) => {
  // Mở một luồng kết nối riêng để làm Transaction (Lưu vào 2 bảng cùng lúc)
  const client = await pool.connect();

  try {
    const { title, price, primary_image_url } = req.body;
    const sellerId = req.user.id; // Lấy ID của người bán từ thẻ bài đăng nhập

    await client.query("BEGIN"); // 🛑 Bắt đầu giao dịch

    // Bước 1: Lưu vào bảng products
    // (Tạm thời lấy bừa 1 category_id có sẵn và hardcode vài thông tin bắt buộc)
    const insertProductQuery = `
      INSERT INTO products (title, price, seller_id, category_id, condition, location, status)
      VALUES (
        $1, 
        $2, 
        $3, 
        (SELECT id FROM categories LIMIT 1), 
        'like_new', 
        'Chưa xác định', 
        'available'
      )
      RETURNING id;
    `;
    const productResult = await client.query(insertProductQuery, [
      title,
      price,
      sellerId,
    ]);
    const newProductId = productResult.rows[0].id; // Rút cái ID vừa tạo ra

    // Bước 2: Lưu link ảnh vào bảng product_images
    if (primary_image_url) {
      const insertImageQuery = `
        INSERT INTO product_images (product_id, image_url, is_primary)
        VALUES ($1, $2, true);
      `;
      await client.query(insertImageQuery, [newProductId, primary_image_url]);
    }

    await client.query("COMMIT"); // ✅ Ghi nhận thành công cả 2 bảng

    res
      .status(201)
      .json({ message: "Đăng tin thành công!", productId: newProductId });
  } catch (error) {
    await client.query("ROLLBACK"); // ❌ Có lỗi phát là thu hồi lại toàn bộ!
    console.error("Lỗi khi đăng tin:", error);
    res.status(500).json({ message: "Lỗi Server khi lưu dữ liệu" });
  } finally {
    client.release(); // Trả luồng kết nối lại cho hệ thống
  }
});

// API ĐĂNG TIN SẢN PHẨM MỚI (Đã thêm Khu vực & Mô tả)
app.post("/api/products", authMiddleware, async (req, res) => {
  const client = await pool.connect();

  try {
    // 1. Nhận thêm location và description từ React
    const { title, price, primary_image_url, location, description } = req.body;
    const sellerId = req.user.id;

    await client.query("BEGIN");

    // 2. Lưu vào bảng products (Đã hết hardcode, dùng dữ liệu thật)
    const insertProductQuery = `
      INSERT INTO products (title, price, seller_id, category_id, condition, location, description, status)
      VALUES ($1, $2, $3, (SELECT id FROM categories LIMIT 1), 'like_new', $4, $5, 'available')
      RETURNING id;
    `;
    const productResult = await client.query(insertProductQuery, [
      title,
      price,
      sellerId,
      location || "Chưa xác định",
      description || "Chưa có mô tả",
    ]);
    const newProductId = productResult.rows[0].id;

    // 3. Lưu link ảnh
    if (primary_image_url) {
      const insertImageQuery = `
        INSERT INTO product_images (product_id, image_url, is_primary)
        VALUES ($1, $2, true);
      `;
      await client.query(insertImageQuery, [newProductId, primary_image_url]);
    }

    await client.query("COMMIT");
    res
      .status(201)
      .json({ message: "Đăng tin thành công!", productId: newProductId });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Lỗi khi đăng tin:", error);
    res.status(500).json({ message: "Lỗi Server khi lưu dữ liệu" });
  } finally {
    client.release();
  }
});
// API XÓA SẢN PHẨM (Chỉ chủ bài đăng mới được xóa)
app.delete("/api/products/:id", authMiddleware, async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user.id; // Lấy ID của người đang bấm nút Xóa

    // 1. Lục kho xem sản phẩm này của ai
    const checkQuery = await pool.query(
      "SELECT seller_id FROM products WHERE id = $1",
      [productId],
    );

    if (checkQuery.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm!" });
    }

    // 2. Nếu người bấm XÓA không phải là CHỦ SẢN PHẨM -> Đuổi cổ!
    if (checkQuery.rows[0].seller_id !== userId) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa sản phẩm của người khác!" });
    }

    // 3. Chuyển trạng thái sản phẩm thành 'deleted' (Xóa mềm - an toàn nhất)
    await pool.query("UPDATE products SET status = 'deleted' WHERE id = $1", [
      productId,
    ]);

    res.json({ message: "Đã xóa sản phẩm thành công!" });
  } catch (error) {
    console.error("Lỗi xóa sản phẩm:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi xóa" });
  }
});
// API ĐẶT HÀNG TỪ NGƯỜI MUA
app.post("/api/orders", authMiddleware, async (req, res) => {
  try {
    const { productId, price, address, phone, paymentMethod } = req.body;
    const buyerId = req.user.id; // Lấy ID của người đang đăng nhập (người mua)

    // Thêm đơn hàng vào bảng orders trong Db
    const insertOrderQuery = `
      INSERT INTO orders (product_id, buyer_id, total_amount, shipping_address, phone, payment_method, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING id;
    `;

    await pool.query(insertOrderQuery, [
      productId,
      buyerId,
      price,
      address,
      phone,
      paymentMethod,
    ]);

    res.status(201).json({ message: "🎉 Đặt hàng thành công!" });
  } catch (error) {
    // Nếu có lỗi sẽ báo
    console.error("🚨 Lỗi khi lưu đơn hàng vào Database:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi lưu đơn hàng!" });
  }
});
// 1. Thêm sản phẩm vào giỏ hàng
app.post("/api/cart", authMiddleware, async (req, res) => {
  const { productId } = req.body;
  const userId = req.user.id;
  try {
    // Nếu sản phẩm đã có thì tăng số lượng, chưa có thì thêm mới
    await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity) 
       VALUES ($1, $2, 1) 
       ON CONFLICT (user_id, product_id) 
       DO UPDATE SET quantity = cart_items.quantity + 1`,
      [userId, productId],
    );
    res.json({ message: "Đã thêm vào giỏ hàng!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi thêm giỏ hàng" });
  }
});

// 2. Lấy danh sách sản phẩm trong giỏ hàng
app.get("/api/cart", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.quantity, p.id as product_id, p.title, p.price, p.location, 
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image_url
       FROM cart_items c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.user_id = $1`,
      [req.user.id],
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy giỏ hàng" });
  }
});

// 3. API Thanh toán gộp nhiều món
app.post("/api/checkout-bulk", authMiddleware, async (req, res) => {
  const { items, address, phone, paymentMethod } = req.body;
  // items là mảng các object [{product_id, price, quantity}, ...]
  const userId = req.user.id;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    for (let item of items) {
      // Tạo đơn hàng mới
      await client.query(
        `INSERT INTO orders (user_id, product_id, price, address, phone, payment_method, status) 
         VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
        [userId, item.product_id, item.price, address, phone, paymentMethod],
      );
      // Xóa khỏi giỏ hàng
      await client.query(
        `DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2`,
        [userId, item.product_id],
      );
    }
    await client.query("COMMIT");
    res.json({ message: "Thanh toán thành công tất cả mặt hàng!" });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Lỗi thanh toán gộp" });
  } finally {
    client.release();
  }
});
app.listen(PORT, () => {
  console.log(`🚀 Server đang túc trực 24/24 tại http://localhost:${PORT}`);
});
setInterval(() => {}, 60000);
