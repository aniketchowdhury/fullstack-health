import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";

const HomePage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("login");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  React.useEffect(() => {
    const cityData = async () => {
      const res = await fetch("http://localhost:3000/data?city=bangalore");
      if (res.ok) {
        const data = await res.json();
        console.log(data);
      }
      /*const res1 = await fetch("http://localhost:3000/jwt/", {
        method: "GET",
        credentials: "include", // added this part
      });
      if (res1.ok) {
        const data = await res1.json();
        setStatus("logged in");
        navigate("/dashboard");
        console.log("***email details", data);
        const res2 = await fetch("http://localhost:3000/jwt/details", {
          method: "GET",
          credentials: "include", // added this part
        });
        if (res2.ok) {
          const data2 = await res2.json();
          console.log("****health data", data2);
        }
      } else {
        navigate("/");
      }*/
    };
    cityData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log(email, password, name, contact);
  }, [contact, email, name, password]);

  const jwtData = async () => {
    const res = await fetch("http://localhost:3000/jwt/login", {
      method: "POST",
      credentials: "include", // added this part
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setStatus("logged in");
      navigate(`/dashboard`);
      console.log(data);
    }
  };

  const logout = async () => {
    const res = await fetch(`http://localhost:3000/jwt/logout`, {
      method: "GET",
      withCredentials: true,
      credentials: "include", // added this part
      headers: {
        "Content-Type": "application/json",
        // Cookie: "jwt",
      },
    });
    if (res.ok) {
      setStatus("login");
    }
  };
  return (
    <div className="loginContainer">
      {status === "login" && (
        <div className="loginCard">
          <input
            type="text"
            className=""
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
          />
          <input
            type="text"
            className=""
            onChange={(e) => setContact(e.target.value)}
            placeholder="Enter your contact"
          />
          <input
            type="email"
            className=""
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
          <input
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <button onClick={jwtData}>{status}</button>
            <button onClick={() => navigate("/signup")}>SIGN UP</button>
          </div>
        </div>
      )}
      {status === "logged in" && <button onClick={logout}>LogOut</button>}
    </div>
  );
};
export default HomePage;
