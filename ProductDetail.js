import React, { useState } from "react";

const ProductDetail = ({ product, onBack }) => {
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");

  // CON MẮT THẦN: Giải mã token để biết ai đang đăng nhập
  const token = localStorage.getItem("token");
  let currentUserId = null;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      currentUserId = payload.user.id;
    } catch (e) {
      console.error("Lỗi đọc thẻ bài");
    }
  }

  // Kiểm tra quyền chủ sở hữu
  const isOwner = currentUserId === product.seller_id;

  // HÀM XỬ LÝ ĐẶT HÀNG TRỰC TIẾP
  const handleOrder = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.product_id,
          price: product.price,
          address: address,
          phone: phone,
          paymentMethod: paymentMethod,
        }),
      });

      if (response.ok) {
        alert("🎉 Đặt hàng thành công! Người bán sẽ sớm liên hệ với bạn.");
        setShowOrderForm(false);
        onBack();
      } else {
        alert("❌ Lỗi: Bạn cần đăng nhập để mua hàng, hoặc server đang bận!");
      }
    } catch (error) {
      alert("❌ Mất kết nối tới Server!");
    }
  };

  // HÀM XỬ LÝ KHI BẤM NÚT XÓA (Dành cho chủ shop)
  const handleDeleteProduct = async () => {
    if (
      !window.confirm(
        "🚨 Bạn có chắc chắn muốn XÓA sản phẩm này không? Hành động này không thể hoàn tác!",
      )
    )
      return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/products/${product.product_id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        alert("🗑️ Đã xóa sản phẩm bay màu khỏi Trái Đất!");
        window.location.reload();
      } else {
        const data = await response.json();
        alert("❌ Lỗi: " + data.message);
      }
    } catch (error) {
      alert("❌ Mất kết nối tới Server!");
    }
  };

  // HÀM XỬ LÝ THÊM VÀO GIỎ HÀNG
  const addToCart = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product.product_id }),
      });
      if (res.ok) {
        alert("🛒 Đã quăng món này vào giỏ hàng thành công!");
      } else {
        alert("❌ Bạn cần đăng nhập để dùng giỏ hàng nhé!");
      }
    } catch (error) {
      alert("❌ Lỗi Server rồi!");
    }
  };

  return (
    <div
      style={{
        backgroundColor: "white",
        padding: "30px",
        borderRadius: "10px",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        marginTop: "20px",
      }}
    >
      {/* THANH CÔNG CỤ TRÊN CÙNG */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={onBack}
          style={{
            padding: "10px 20px",
            cursor: "pointer",
            backgroundColor: "#ecf0f1",
            border: "none",
            borderRadius: "5px",
            fontWeight: "bold",
            color: "#2c3e50",
          }}
        >
          ⬅ Quay lại danh sách
        </button>

        {isOwner && (
          <button
            onClick={handleDeleteProduct}
            style={{
              padding: "10px 20px",
              cursor: "pointer",
              backgroundColor: "#c0392b",
              border: "none",
              borderRadius: "5px",
              fontWeight: "bold",
              color: "white",
            }}
          >
            🗑️ Xóa Sản Phẩm Này
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 400px" }}>
          <img
            src={
              product.primary_image_url ||
              "https://placehold.co/600x400?text=Chua+co+anh"
            }
            alt={product.title}
            style={{
              width: "100%",
              borderRadius: "10px",
              objectFit: "cover",
              border: "1px solid #eee",
            }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://placehold.co/600x400?text=Chua+co+anh";
            }}
          />
        </div>

        <div style={{ flex: "1 1 400px" }}>
          <h2 style={{ marginTop: 0, color: "#2c3e50", fontSize: "28px" }}>
            {product.title}
          </h2>
          <h1 style={{ color: "#e74c3c", marginTop: "10px" }}>
            {product.price
              ? product.price.toLocaleString() + " VNĐ"
              : "Liên hệ"}
          </h1>

          {showOrderForm ? (
            <div
              style={{
                backgroundColor: "#f9f9f9",
                padding: "20px",
                borderRadius: "8px",
                marginTop: "20px",
              }}
            >
              <h3 style={{ marginTop: 0, color: "#27ae60" }}>
                📦 Thông tin giao hàng
              </h3>
              <form
                onSubmit={handleOrder}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                }}
              >
                <input
                  type="text"
                  placeholder="Số điện thoại liên hệ"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  style={{
                    padding: "10px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                  }}
                />
                <textarea
                  placeholder="Địa chỉ giao hàng (Số nhà, đường, quận/huyện...)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  style={{
                    padding: "10px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    minHeight: "80px",
                  }}
                />

                <div>
                  <p style={{ fontWeight: "bold", marginBottom: "5px" }}>
                    💳 Phương thức thanh toán:
                  </p>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "5px",
                      border: "1px solid #ccc",
                    }}
                  >
                    <option value="COD">
                      💵 Thanh toán khi nhận hàng (COD)
                    </option>
                    <option value="BANKING">🏦 Chuyển khoản ngân hàng</option>
                    <option value="MOMO">📱 Ví MoMo</option>
                  </select>
                </div>

                <div
                  style={{ display: "flex", gap: "10px", marginTop: "10px" }}
                >
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: "12px",
                      backgroundColor: "#27ae60",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    ✅ Xác Nhận Đặt Hàng
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOrderForm(false)}
                    style={{
                      padding: "12px 20px",
                      backgroundColor: "#95a5a6",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <div
                style={{
                  marginTop: "20px",
                  lineHeight: "1.8",
                  color: "#444",
                  fontSize: "16px",
                  backgroundColor: "#f9f9f9",
                  padding: "20px",
                  borderRadius: "8px",
                }}
              >
                <p>
                  <strong>Tình trạng:</strong>{" "}
                  {product.condition === "like_new"
                    ? "Như mới"
                    : product.condition || "Đang cập nhật"}
                </p>
                <p>
                  <strong>Khu vực:</strong>{" "}
                  {product.location || "Chưa xác định"}
                </p>
                <p>
                  <strong>Mô tả chi tiết:</strong>{" "}
                  {product.description ||
                    "Chủ shop chưa thêm mô tả chi tiết cho món đồ này."}
                </p>
              </div>

              {/* CHỈ HIỆN 3 NÚT NÀY NẾU KHÔNG PHẢI CHỦ SẢN PHẨM */}
              {!isOwner && (
                <div
                  style={{ display: "flex", gap: "15px", marginTop: "30px" }}
                >
                  <button
                    onClick={() => setShowOrderForm(true)}
                    style={{
                      flex: 1,
                      padding: "15px",
                      backgroundColor: "#27ae60",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      fontSize: "16px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    🛒 Đặt Mua Ngay
                  </button>

                  <button
                    onClick={addToCart}
                    style={{
                      flex: 1,
                      padding: "15px",
                      backgroundColor: "#3498db",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      fontSize: "16px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    ➕ Thêm vào giỏ
                  </button>

                  <button
                    onClick={() =>
                      alert(
                        `📞 Bạn vui lòng liên hệ với người bán theo số điện thoại: ${product.seller_phone || "Chưa cập nhật"} này nhé!`,
                      )
                    }
                    style={{
                      flex: 1,
                      padding: "15px",
                      backgroundColor: "#e67e22",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      fontSize: "16px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    📞 Liên Hệ
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
