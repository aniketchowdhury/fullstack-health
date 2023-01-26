import React, { useState } from "react";
import { useNavigate } from "react-router";

const SignUp = () => {
  const navigate = useNavigate();
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const signUpClickHandler = async () => {
    try {
      if (email === "" || password === "" || name === "") {
        setError("please fill the details");
        return;
      }
      const res = await fetch(`http://localhost:3000/jwt/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: name,
          email: email,
          password: password,
          contact: contact,
        }),
      });
      let msg = null;
      if (res.ok) {
        console.log("success");
        navigate("/");
      } else if ([400, 500].includes(res.status)) {
        msg = await res.json();
        throw msg;
      } else throw msg;
    } catch (err) {
      console.log(err);
      setError(err ?? "Some error");
    }
  };

  return (
    <>
      <div className="loginContainer">
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
          {error && <span style={{ marginTop: "20px" }}>{error}</span>}
          <button onClick={() => signUpClickHandler()}>SUBMIT</button>
        </div>
      </div>
    </>
  );
};
export default SignUp;
