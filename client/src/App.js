import logo from './logo.svg';
import './App.css';
import { Terminal } from 'xterm';
import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';


function App() {
  return (
    <Container className="App">
        <Row>
          <Col>foo</Col>
          <Col><Term /></Col>
        </Row>
    </Container>
  );
}


function Term(props) {
  let term = new Terminal();
  React.useEffect(() => {
    //term.open(document.getElementById('terminal'));
    //term.write("Hello, World!");
    return () => {
    };
  });

  function setupTerm(element) {
    console.log(element);
    term.open(element);
    term.write("Hello, Ref!");
  }
  return (
    <div ref={setupTerm}></div>
  );
}

export default App;
