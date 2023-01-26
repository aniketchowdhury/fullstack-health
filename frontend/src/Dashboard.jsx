import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import NewEntry from "./NewEntry";

const Dashboard = () => {
  const [isModalOpen, setModal] = useState(false);
  const [details, setDetails] = useState(null);
  const [searchValue, setValue] = useState("");
  const [offset, setOffset] = useState(0);
  const [isUpdateCalorieModalOpen, setUpdateCalorieModal] = useState(null);
  const [updatedCalorie, setUpdatedCalorie] = useState("");
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/jwt/details?offset=${offset}&limit=10`,
          {
            method: "GET",
            credentials: "include", // added this part
          }
        );
        if (res.ok) {
          const data = await res.json();
          console.table("***details:-", data[0]);
          setDetails(data[0]);
        }
      } catch (err) {}
    };
    fetchData();
  }, [isModalOpen, isUpdateCalorieModalOpen, offset]);
  const openModal = () => {
    setModal(true);
  };
  const closeModal = () => {
    setModal(false);
  };
  const closeUpdateModal = () => {
    setUpdateCalorieModal(null);
  };
  const handleDelete = async (item) => {
    try {
      const res = await fetch("http://localhost:3000/jwt/details", {
        method: "DELETE",
        credentials: "include", // added this part
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          calorie_value: item?.calorie_value,
          intake_date: item?.intake_date,
        }),
      });
      if (res.ok) {
        const msg = await res.json();
        console.log("success", msg);
      } else throw res;
    } catch (err) {
      const msg = await err.json();
      console.log("error", msg);
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch("http://localhost:3000/jwt/details", {
        method: "PATCH",
        credentials: "include", // added this part
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          calorie_value: updatedCalorie,
          intake_date: isUpdateCalorieModalOpen?.intake_date,
        }),
      });
      if (res.ok) {
        const msg = await res.json();
        console.log("success", msg);
      } else throw res;
    } catch (err) {
      const msg = await err.json();
      console.log("error", msg);
    } finally {
      setUpdateCalorieModal(null);
      setUpdatedCalorie("");
    }
  };
  const renderUpdateModal = () => {
    return (
      // <div className="modal">
      <Modal onClose={closeUpdateModal}>
        <input
          value={updatedCalorie}
          onChange={(e) => setUpdatedCalorie(e.target.value)}
        />
        <button onClick={() => handleUpdate()}>SUBMIT</button>
      </Modal>
      // </div>
    );
  };
  const handleSearch = async () => {
    try {
      const res = await fetch(
        `http://localhost:3000/jwt/details?intake_date=${searchValue}`,
        {
          method: "GET",
          credentials: "include", // added this part
        }
      );
      if (res.ok) {
        const data = await res.json();
        console.log("***search data: ", data?.calorie_intake);
      } else throw res;
    } catch (err) {
      const msg = await err.json();
      console.log(msg);
    }
  };
  return (
    <>
      {isModalOpen && (
        <Modal onClose={closeModal}>
          <NewEntry onClose={closeModal} />
        </Modal>
      )}
      {isUpdateCalorieModalOpen && renderUpdateModal()}
      <button onClick={openModal}>add daily calorie intake</button>
      <input type={searchValue} onChange={(e) => setValue(e.target.value)} />
      <button onClick={() => handleSearch()}>SEARCH</button>
      <h2>{details?.email}</h2>
      <h2>{details?.weight}</h2>
      <h2>{details?.height}</h2>
      <ul style={{ display: "flex", flexDirection: "column" }}>
        {details?.calorie_intake &&
          details?.calorie_intake?.map((item, index) => (
            <li key={index}>
              <h4>
                {item?.calorie_value}&nbsp;&nbsp;&nbsp;{item?.intake_date}
              </h4>
              <button onClick={() => handleDelete(item)}>DELETE</button>
              <button onClick={() => setUpdateCalorieModal(item)}>
                UPDATE
              </button>
              {/* <button onClick={() => handleUpdate(item)}>UPDATE</button> */}
            </li>
          ))}
      </ul>
      <div
        style={{
          marginTop: "20px",
          display: "flex",
          flexDirection: "row",
          gap: "20px",
        }}
      >
        <button
          // style={{ marginTop: "20px" }}
          onClick={() => setOffset(offset + 2)}
        >
          LOAD MORE
        </button>
        {offset > 0 && <button onClick={() => setOffset(0)}>RESET</button>}
      </div>
    </>
  );
};
export default Dashboard;
