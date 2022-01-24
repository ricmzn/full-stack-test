import { Col, Modal, ModalBody, ModalHeader, Row, Table } from "reactstrap";
import type { Beer, Quantity } from "../src/punkAPI";

function ingredient({ name, amount }: { name: string, amount: Quantity }) {
  return <><strong>{name}</strong> - {amount.value} {amount.unit}<br /></>;
}

export default function ({ details, unsetDetails }: { details?: Beer, unsetDetails: () => void }) {
  return (
    <Modal size="lg" isOpen={details != null} toggle={unsetDetails}>
      <ModalHeader>{details?.name}</ModalHeader>
      <ModalBody>
        <Row>
          <Col xs={12} md={4} lg={3}>
            <img src={details?.image_url} />
          </Col>
          <Col xs={12} md={8} lg={9}>
            <h5>{details?.tagline}</h5>
            <hr />
            <h6>First brewed {details?.first_brewed}</h6>
            <p>{details?.description}</p>
            <p>Alcohol Content: {details?.abv}%</p>
            <h5>Goes well with</h5>
            <ul>
              {details?.food_pairing.map((food) => <li>{food}</li>)}
            </ul>
            <h5>Brewer's Tips</h5>
            <p>{details?.brewers_tips}</p>
            <Table bordered>
              <thead>
                <tr>
                  <th>Malts</th>
                  <th>Hops</th>
                  <th>Yeast</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{details?.ingredients.malt.map(ingredient)}</td>
                  <td>{details?.ingredients.hops.map(ingredient)}</td>
                  <td><strong>{details?.ingredients.yeast}</strong></td>
                </tr>
              </tbody>
            </Table>
          </Col>
        </Row>
      </ModalBody>
    </Modal>
  );
}