import axios from "axios";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Col, Form, FormGroup, Input, Label } from "reactstrap";
import { refreshToken, setToken } from "../auth";

type FailureReason = "connection" | "credentials";

function getReasonText(reason: FailureReason) {
  switch (reason) {
    case "connection":
      return "Não foi possível enviar as informações, verifique a sua conexão";
    case "credentials":
      return "Usuário ou senha incorretos";
  }
}

function AuthAlert(props: { reason?: FailureReason }) {
  if (props.reason) {
    return <Alert color="danger">
      {getReasonText(props.reason)}
    </Alert>;
  }
  return null;
}

async function submit(event: FormEvent<HTMLFormElement>, navigate: (to: string) => void, setFailureReason: (reason?: FailureReason) => void, setBusy: (busy: boolean) => void) {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const elements = form.elements as any;
  try {
    setBusy(true);
    setFailureReason(undefined);
    const response = await axios.post("/api/login", {
      username: elements.username.value,
      password: elements.password.value,
    });
    setToken(response.data);
    refreshToken();
    navigate("/");
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status == 401) {
        setFailureReason("credentials");
      } else {
        setFailureReason("connection");
      }
      setBusy(false);
      return;
    }
    setBusy(false);
    throw err;
  }
}

export default function () {
  const [reason, setReason] = useState<FailureReason | undefined>();
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  return (
    <Col md={{ offset: 3, size: 6 }} className="vertical-center">
      <AuthAlert reason={reason} />
      <Form onSubmit={(event) => submit(event, navigate, setReason, setBusy)}>
        <FormGroup>
          <Label for="username">Usuário</Label>
          <Input id="username" name="username" autoComplete="off" autoFocus />
        </FormGroup>
        <FormGroup>
          <Label for="password">Senha</Label>
          <Input id="password" name="password" autoComplete="off" type="password" />
        </FormGroup>
        <Button color="primary" disabled={busy}>Entrar</Button>
      </Form>
    </Col>
  );
}
