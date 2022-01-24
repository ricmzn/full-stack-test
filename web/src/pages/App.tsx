import axios from "axios";
import { useEffect, useState } from "react";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { useDebounce } from "react-use";
import { Button, Col, Input, Row } from "reactstrap";
import type { BeerAPIResponse } from "../../../src/api";
import BeerModal from "../../components/BeerModal";
import BeerTable from "../../components/BeerTable";
import { setToken } from "../auth";
import type { Beer } from "../punkAPI";

function logout(navigate: NavigateFunction) {
  setToken(undefined);
  navigate("/login");
}

function updateData(setData: (data: BeerAPIResponse | undefined) => void, search: string, page: number, navigate: NavigateFunction) {
  axios.get<BeerAPIResponse>("/api/beers", { params: { search, page } })
    .then((response) => setData(response.data))
    .catch((error) => {
      if (axios.isAxiosError(error) && error?.response?.status == 401) {
        navigate("/login");
      }
    });
}

export default function () {
  const [data, setData] = useState<BeerAPIResponse | undefined>();
  const [details, setDetails] = useState<Beer | undefined>();
  const [searchParam, setSearchParam] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  useDebounce(() => setSearchParam(search), 500, [search]);
  useEffect(() => updateData(setData, search, page, navigate), [searchParam, page]);
  useEffect(() => setPage(1), [searchParam]);
  return (
    <>
      <div className="d-grid">
        <Button type="button" color="secondary" onClick={() => logout(navigate)}>Log out</Button>
      </div>
      <hr />
      <Input type="search" autoFocus placeholder="Search" onInput={(event) => setSearch((event.target as HTMLInputElement).value)} />
      <BeerTable data={data?.data} setDetails={setDetails} />
      <BeerModal details={details} unsetDetails={() => setDetails(undefined)} />
      <Row>
        <Col xs={6} className="text-start fs-5">Page {page}/{data?.pages ?? 1}</Col>
        <Col xs={6} className="text-end">
          <Button href="#" disabled={page == 1} onClick={() => setPage(page - 1)}>&lt; Previous</Button>
          {" "}
          <Button href="#" disabled={page == data?.pages} onClick={() => setPage(page + 1)}>Next &gt;</Button>
        </Col>
      </Row>
    </>
  );
}
