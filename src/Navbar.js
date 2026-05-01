import React from "react";

const Navbar = ({ setSearchTerm }) => {
  // <-- Nhận dây mạng từ App.js
  const isLoggedIn = !!localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "15px 30px",
        backgroundColor: "#2c3e50",
        color: "white",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      }}
    >
      {/* Bấm vào Logo để F5 quay về trang chủ */}
      <h2
        style={{ margin: 0, cursor: "pointer" }}
        onClick={() => window.location.reload()}
      >
        🛒 Old-Shop
      </h2>

      <div style={{ flex: 1, margin: "0 40px", maxWidth: "500px" }}>
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm theo tên..."
          onChange={(e) =>
            setSearchTerm ? setSearchTerm(e.target.value) : null
          }
          style={{
            width: "100%",
            padding: "10px 15px",
            borderRadius: "20px",
            border: "none",
            outline: "none",
          }}
        />
      </div>

      <div>
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 20px",
              backgroundColor: "#e74c3c",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Đăng Xuất
          </button>
        ) : (
          <span style={{ fontSize: "14px", fontStyle: "italic" }}>
            Khách vãng lai
          </span>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
