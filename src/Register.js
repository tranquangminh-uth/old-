import React, { useState } from "react";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, fullName }), // Gửi 3 thông tin này xuống Backend
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("🎉 " + data.message);
        // Xóa form đi cho đẹp sau khi đăng ký xong
        setEmail("");
        setPassword("");
        setFullName("");
      } else {
        setMessage("❌ " + data.message); // Báo lỗi nếu trùng email
      }
    } catch (error) {
      setMessage("❌ Lỗi không thể kết nối đến Server!");
    }
  };

  return (
    <div
      style={{ padding: "50px", textAlign: "center", fontFamily: "sans-serif" }}
    >
      <h2>Đăng Ký Tài Khoản Mới</h2>
      <form onSubmit={handleRegister}>
        <div>
          <input
            type="text"
            placeholder="Nhập họ và tên..."
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={{ margin: "10px", padding: "10px", width: "250px" }}
          />
        </div>
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
            backgroundColor: "#008CBA",
            color: "white",
            border: "none",
            fontWeight: "bold",
          }}
        >
          Đăng Ký Ngay
        </button>
      </form>
      <h3 style={{ color: "#333", marginTop: "20px" }}>{message}</h3>
    </div>
  );
};

export default Register;
