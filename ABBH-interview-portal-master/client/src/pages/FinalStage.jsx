import { useEffect, useState } from "react";
import api from "../services/api";

export default function FinalStage() {
  const [link, setLink] = useState("");

  useEffect(() => {
    api
      .get("/final-link")
      .then((res) => setLink(res.data.finalLink))
      .catch(() => setLink(null));
  }, []);

  return (
    <div>
      <h2>Final Stage</h2>
      {link ? (
        <a href={link} target="_blank">
          Go to Final Interview
        </a>
      ) : (
        "Not available yet"
      )}
    </div>
  );
}
