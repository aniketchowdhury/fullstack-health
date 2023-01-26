import React from "react";

const Modal = (props) => {
  const { onClose } = props;
  // const [weight, setWeight] = useState(0);
  // const [height, setHeight] = useState(0);
  // const [calorie, setCalorie] = useState("");
  /*const handleSubmit = async () => {
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
    }
  };*/
  return (
    <div className="inset">
      <div className="modal">
        <div style={{ display: "flex", flex: "1 1 auto" }}>
          <span>Modal open</span>
          <button onClick={onClose}>CLOSE</button>
        </div>
        {props.children}
      </div>
    </div>
  );
};
export default Modal;
