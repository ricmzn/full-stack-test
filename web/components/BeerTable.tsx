import { useEffect } from "react";
import { Table } from "reactstrap";
import { Beer } from "../src/punkAPI";

export default function (props: { data?: Beer[], setDetails: (beer: Beer) => void }) {
  if (!props.data) {
    return <span>Loading...</span>;
  }
  return <Table hover striped bordered>
    <thead>
      <tr>
        <th>Name</th>
        <th>Tagline</th>
        <th>First Brewed</th>
      </tr>
    </thead>
    <tbody>
      {props.data.map((beer) => (
        <tr className="interactive" onClick={() => props.setDetails(beer)}>
          <td>{beer.name}</td>
          <td>{beer.tagline}</td>
          <td>{beer.first_brewed}</td>
        </tr>
      ))}
    </tbody>
  </Table>;
}
