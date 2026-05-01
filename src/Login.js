import React, { useState } from "react";

const Login = () => {
  // Nơi chứa dữ liệu người dùng nhập vào
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  // Hàm xử lý khi bấm nút "Đăng Nhập"
  const handleLogin = async (e) => {
    e.preventDefault(); // Ngăn web load lại trang gây mất dữ liệu

    try {
      // Bắn thông tin xuống API đăng nhập của Backend
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("🎉 Đăng nhập thành công! ");
        // Cất thẻ bài  vào két sắt của trình duyệt (localStorage)
        localStorage.setItem("token", data.token);
        window.location.reload();
        console.log("Đây là Thẻ bài JWT của bạn:", data.token);
      } else {
        // Sai pass hoặc email
        setMessage("❌ " + data.message);
      }
    } catch (error) {
      setMessage("❌ Lỗi không thể kết nối đến Server!");
    }
  };

  return (
    <div
      style={{ padding: "50px", textAlign: "center", fontFamily: "sans-serif" }}
    >
      <h2>Đăng Nhập Hệ Thống</h2>
      <form onSubmit={handleLogin}>
        <div>
          <input
            type="email"
            placeholder="Nhập email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ margin: "10px", padding: "10px", width: "250px" }}
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Nhập mật khẩu..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ margin: "10px", padding: "10px", width: "250px" }}
          />
        </div>
        <button
          type="submit"
          style={{
            padding: "10px 20px",
            cursor: "pointer",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            fontWeight: "bold",
          }}
        >
          Đăng Nhập
        </button>
      </form>
      <h3 style={{ color: "#333", marginTop: "20px" }}>{message}</h3>
    </div>
  );
};

export default Login;
