import { useState } from "react";
import api from "../services/api";

export default function WrittenTest() {
  const [answers, setAnswers] = useState({});

  const submitTest = () => {
    api
      .post("/written-test", { answers })
      .then(() => alert("Submitted!"))
      .catch((err) => alert(err.response.data.error));
  };

  return (
    <div>
      <h2>Written Test</h2>
      <textarea onChange={(e) => setAnswers({ q1: e.target.value })} />
      <button onClick={submitTest}>Submit</button>
    </div>
  );
}
