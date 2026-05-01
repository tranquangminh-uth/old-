import React, { useState, useEffect } from "react";
import Login from "./Login";
import Register from "./Register";
import Navbar from "./Navbar";
import AddProduct from "./AddProduct";
import ProductDetail from "./ProductDetail"; // Gọi giao diện Xem Chi Tiết vào

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Công tắc mới: Lưu thông tin sản phẩm đang được chọn để xem chi tiết
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/products")
      .then((response) => response.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Lỗi kết nối:", error);
        setLoading(false);
      });
  }, []);

  const isLoggedIn = !!localStorage.getItem("token");

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f4f6f8",
        minHeight: "100vh",
      }}
    >
      <Navbar setSearchTerm={setSearchTerm} />

      <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Chỉ hiện Đăng Nhập/Đăng Ký khi: Chưa đăng nhập VÀ Đang ở trang chủ */}
        {!isLoggedIn && !selectedProduct && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              marginBottom: "40px",
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "10px",
              boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
            }}
          >
            <Register />
            <Login />
          </div>
        )}

        {/* CÔNG TẮC ĐIỀU HƯỚNG */}
        {selectedProduct ? (
          // NẾU CÓ SẢN PHẨM ĐƯỢC CHỌN -> Hiển thị trang chi tiết
          <ProductDetail
            product={selectedProduct}
            onBack={() => setSelectedProduct(null)}
          />
        ) : (
          // NẾU KHÔNG CÓ -> Hiển thị Danh sách sản phẩm (Trang Chủ)
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "2px solid #3498db",
                paddingBottom: "10px",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ color: "#2c3e50", margin: 0 }}>
                🔥 Sản Phẩm Mới Đăng
              </h2>
              {isLoggedIn && !showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#f39c12",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  + Đăng Tin Nhanh
                </button>
              )}
            </div>

            {showAddForm && (
              <AddProduct
                onCancel={() => setShowAddForm(false)}
                onAddSuccess={() => {
                  setShowAddForm(false);
                  window.location.reload();
                }}
              />
            )}

            {loading ? (
              <p>⏳ Đang tải dữ liệu...</p>
            ) : products.length === 0 ? (
              <p style={{ color: "red" }}>Kho hàng hiện tại đang trống.</p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                  gap: "25px",
                  marginTop: "20px",
                }}
              >
                {products
                  .filter((product) =>
                    product.title
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()),
                  )
                  .map((product, index) => (
                    <div
                      key={index}
                      style={{
                        backgroundColor: "white",
                        borderRadius: "10px",
                        overflow: "hidden",
                        boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
                        transition: "transform 0.2s",
                      }}
                    >
                      <img
                        src={
                          product.primary_image_url ||
                          "https://placehold.co/400x300?text=Chua+co+anh"
                        }
                        alt={product.title}
                        style={{
                          width: "100%",
                          height: "200px",
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://placehold.co/400x300?text=Chua+co+anh";
                        }}
                      />

                      <div style={{ padding: "15px" }}>
                        <h3
                          style={{
                            fontSize: "16px",
                            margin: "0 0 5px 0",
                            color: "#333",
                            lineHeight: "1.4",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {product.title}
                        </h3>
                        <p
                          style={{
                            color: "#e74c3c",
                            fontWeight: "bold",
                            fontSize: "18px",
                            margin: "0 0 10px 0",
                          }}
                        >
                          {product.price
                            ? product.price.toLocaleString() + " VNĐ"
                            : "Liên hệ"}
                        </p>

                        {/* BẤM NÚT NÀY SẼ KÍCH HOẠT CÔNG TẮC CHUYỂN TRANG */}
                        <button
                          onClick={() => setSelectedProduct(product)}
                          style={{
                            width: "100%",
                            padding: "10px",
                            backgroundColor: "#3498db",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            marginTop: "10px",
                          }}
                        >
                          Xem Chi Tiết
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
