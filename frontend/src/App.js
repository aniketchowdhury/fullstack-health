// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import Dashboard from "./Dashboard";
import ErrorPage from "./ErrorPage";
import HomePage from "./HomePage";
import SignUp from "./SignUp";

function App() {
  // const navigation = useNavigate();
  // const location = useLocation();
  const [data, setData] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    const ws = new WebSocket("wss://ws.bitstamp.net");
    const apiCall = {
      event: "bts:subscribe",
      data: { channel: "order_book_btcusd" },
    };
    ws.onopen = (event) => {
      ws.send(JSON.stringify(apiCall));
    };
    ws.onmessage = function (event) {
      // const json = JSON.parse(event.data);
      try {
        // if ((json.event === 'data')) {
        console.log("from server", event.data);
      } catch (err) {
        console.log(err);
      }
    };
    //clean up function
    return () => ws.close();
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res2 = await fetch("http://localhost:3000/jwt/", {
          method: "GET",
          credentials: "include", // added this part
        });
        if (res2.ok) {
          const data2 = await res2.json();
          setIsLoggedIn(true);
          setData(data2);
          // navigation("/dashboard");
          console.log("****health data", data2);
        } else throw res2;
      } catch (err) {
        console.log("App.js error");
        setIsLoggedIn(false);
        // navigation("/");
        // window.location.href = "/";
        console.log(err);
      }
    };
    fetchData();
    // [location, navigation]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setIsLoggedIn(false);
      window.location.href = "/";
    }
  };
  return (
    // <BrowserRouter>
    <>
      {isLoggedIn && (
        <div
          style={{
            display: "flex",
            flexDirection: "row-reverse",
            padding: "20px",
          }}
        >
          {data?.image && <img src={data.image} alt="avatar" />}
          <p>Hello {data.username}</p>
          <button onClick={() => logout()}>LOG OUT</button>
        </div>
      )}
      <Routes>
        <Route path="/" exact element={<HomePage />} />
        <Route path="/signup" exact element={<SignUp />} />
        <Route path="/dashboard" exact element={<Dashboard />} />
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </>
    // </BrowserRouter>
  );
}
export default App;
