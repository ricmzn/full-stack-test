import { Link } from "react-router-dom";

export default function () {
  return <div className="vertical-center text-center">
    <h1 className="notfound">Página não encontrada</h1>
    <Link to="/" className="notfound">Retornar para o início</Link>
  </div>;
}
