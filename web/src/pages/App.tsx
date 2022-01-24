import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function () {
  const [data, setData] = useState<{} | undefined>();
  const navigate = useNavigate();
  useEffect(() => {
    axios.get("/api/beers")
      .then((response) => setData(response.data))
      .catch((error) => {
        if (axios.isAxiosError(error) && error?.response?.status == 401) {
          navigate("/login");
        }
      });
  }, []);
  if (data) {
    return <pre>{JSON.stringify(data, null, 4)}</pre>;
  } else {
    return <span>Carregando...</span>;
  }
}
