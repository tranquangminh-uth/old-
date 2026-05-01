import React, { useState } from "react";

const AddProduct = ({ onCancel, onAddSuccess }) => {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [location, setLocation] = useState(""); // <-- Thêm Trí nhớ cho Khu vực
  const [description, setDescription] = useState(""); // <-- Thêm Trí nhớ cho Mô tả

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          title: title,
          price: parseFloat(price),
          primary_image_url: imageUrl,
          location: location, // <-- Gửi Khu vực xuống Backend
          description: description, // <-- Gửi Mô tả xuống Backend
        }),
      });

      if (response.ok) {
        alert("🎉 Đăng tin thành công!");
        onAddSuccess(); // Tắt form và load lại trang
      } else {
        alert("❌ Đăng tin thất bại. Vui lòng thử lại!");
      }
    } catch (error) {
      alert("❌ Lỗi kết nối tới Server!");
    }
  };

  return (
    <div
      style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "10px",
        marginBottom: "20px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
      }}
    >
      <h3 style={{ marginTop: 0, color: "#2c3e50" }}>
        📝 Đăng Tin Sản Phẩm Mới
      </h3>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "15px" }}
      >
        <input
          type="text"
          placeholder="Tên sản phẩm (VD: CPU R5 7500f...)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        />
        <input
          type="number"
          placeholder="Giá bán (VNĐ)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          style={{
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        />
        <input
          type="text"
          placeholder="Link ảnh sản phẩm (http://...)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          required
          style={{
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        />

        {/* 2 Ô NHẬP LIỆU MỚI  */}
        <input
          type="text"
          placeholder="Khu vực của bạn (VD: Hà Nội, TP.HCM, Dĩ An...)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          style={{
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        />
        <textarea
          placeholder="Mô tả chi tiết tình trạng món đồ (Có xước xát gì không, còn bảo hành không?)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          style={{
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            minHeight: "100px",
          }}
        />

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="submit"
            style={{
              flex: 1,
              padding: "12px",
              backgroundColor: "#27ae60",
              color: "white",
              border: "none",
              borderRadius: "5px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            🚀 Đăng Bán Ngay
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "12px 20px",
              backgroundColor: "#c0392b",
              color: "white",
              border: "none",
              borderRadius: "5px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
