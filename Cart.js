import React, { useState, useEffect } from "react";

const Cart = ({ onBack }) => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]); // Lưu ID những món được tick
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch("http://localhost:5000/api/cart", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setCartItems(data));
  }, []);

  // Xử lý khi tick chọn từng món
  const handleTick = (productId) => {
    if (selectedIds.includes(productId)) {
      setSelectedIds(selectedIds.filter((id) => id !== productId));
    } else {
      setSelectedIds([...selectedIds, productId]);
    }
  };

  const totalAmount = cartItems
    .filter((item) => selectedIds.includes(item.product_id))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (selectedIds.length === 0) return alert("Vui lòng chọn ít nhất 1 món!");

    const itemsToBuy = cartItems.filter((item) =>
      selectedIds.includes(item.product_id),
    );

    // Gửi yêu cầu thanh toán (Ở đây mình giản lược, bạn có thể thêm form nhập địa chỉ)
    const response = await fetch("http://localhost:5000/api/checkout-bulk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        items: itemsToBuy,
        address: "Địa chỉ mặc định",
        phone: "090xxxxxxx",
        paymentMethod: "COD",
      }),
    });

    if (response.ok) {
      alert("🎉 Đã thanh toán gộp thành công!");
      window.location.reload();
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "white",
        borderRadius: "10px",
      }}
    >
      <h2>🛒 Giỏ hàng của bạn</h2>
      <button onClick={onBack}>⬅ Tiếp tục mua sắm</button>

      {cartItems.map((item) => (
        <div
          key={item.id}
          style={{
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid #eee",
            padding: "10px 0",
          }}
        >
          <input
            type="checkbox"
            checked={selectedIds.includes(item.product_id)}
            onChange={() => handleTick(item.product_id)}
            style={{ width: "20px", height: "20px", marginRight: "15px" }}
          />
          <img
            src={item.image_url}
            width="80"
            style={{ borderRadius: "5px" }}
          />
          <div style={{ marginLeft: "15px", flex: 1 }}>
            <h4>{item.title}</h4>
            <p style={{ color: "red" }}>{item.price.toLocaleString()} VNĐ</p>
          </div>
        </div>
      ))}

      <div style={{ marginTop: "20px", textAlign: "right" }}>
        <h3>
          Tổng thanh toán ({selectedIds.length} món):
          <span style={{ color: "red" }}>
            {" "}
            {totalAmount.toLocaleString()} VNĐ
          </span>
        </h3>
        <button
          onClick={handleCheckout}
          style={{
            padding: "15px 30px",
            backgroundColor: "#27ae60",
            color: "white",
            border: "none",
            borderRadius: "5px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          🚀 THANH TOÁN NGAY
        </button>
      </div>
    </div>
  );
};

export default Cart;
