import React, { useState } from "react";

const NewEntry = (props) => {
  const [weight, setWeight] = useState(0);
  const [height, setHeight] = useState(0);
  const [calorie, setCalorie] = useState("");
  const handleSubmit = async () => {
    try {
      const res = await fetch("http://localhost:3000/jwt/details", {
        method: "POST",
        credentials: "include", // added this part
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          weight: weight,
          height: height,
          calorie_value: calorie,
          intake_date: new Date(),
        }),
      });
      if (res.ok) {
        console.log("good");
      } else throw res;
    } catch (err) {
      console.log("error");
    } finally {
      props.onClose();
    }
  };
  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        <input
          type="value"
          placeholder="enter weight"
          onChange={(e) => setWeight(e.target.value)}
        />
        <input
          type="value"
          placeholder="enter height"
          onChange={(e) => setHeight(e.target.value)}
        />
        <input
          type="value"
          placeholder="enter calorie"
          onChange={(e) => setCalorie(e.target.value)}
        />
        <button onClick={() => handleSubmit()}>SUBMIT</button>
      </div>
    </>
  );
};
export default NewEntry;
