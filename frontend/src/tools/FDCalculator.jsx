import React, { useState } from 'react'
import { Container, Row, Col, Card, Form, Button, Table } from 'react-bootstrap'
import styles from './Calculators.module.css'

const FDCalculator = () => {
  const [formData, setFormData] = useState({
    principal: '',
    interestRate: '',
    tenure: '',
    tenureType: 'years',
    compounding: 'yearly'
  })
  
  const [result, setResult] = useState(null)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const calculateFD = (e) => {
    e.preventDefault()
    
    const principal = parseFloat(formData.principal)
    const annualRate = parseFloat(formData.interestRate) / 100
    let tenure = parseFloat(formData.tenure)
    
    // Convert tenure to years based on selection
    if (formData.tenureType === 'months') {
      tenure = tenure / 12
    }

    let n // compounding frequency
    switch (formData.compounding) {
      case 'yearly':
        n = 1
        break
      case 'half-yearly':
        n = 2
        break
      case 'quarterly':
        n = 4
        break
      case 'monthly':
        n = 12
        break
      default:
        n = 1
    }

    const amount = principal * Math.pow(1 + annualRate / n, n * tenure)
    const interestEarned = amount - principal

    setResult({
      principal,
      maturityAmount: amount,
      interestEarned,
      totalInvestment: principal
    })
  }

  const resetCalculator = () => {
    setFormData({
      principal: '',
      interestRate: '',
      tenure: '',
      tenureType: 'years',
      compounding: 'yearly'
    })
    setResult(null)
  }

  return (
    <Container className={styles.calculatorPage}>
      <Row className="mb-5">
        <Col>
          <div className={styles.pageHeader}>
            <h1>Fixed Deposit Calculator</h1>
            <p>Calculate your FD maturity amount and interest earnings</p>
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg={6}>
          <Card className={styles.calculatorCard}>
            <Card.Body>
              <Form onSubmit={calculateFD}>
                <Form.Group className="mb-3">
                  <Form.Label>Principal Amount (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    name="principal"
                    value={formData.principal}
                    onChange={handleChange}
                    placeholder="Enter principal amount"
                    required
                    min="0"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Annual Interest Rate (%)</Form.Label>
                  <Form.Control
                    type="number"
                    name="interestRate"
                    value={formData.interestRate}
                    onChange={handleChange}
                    placeholder="Enter interest rate"
                    required
                    min="0"
                    step="0.01"
                  />
                </Form.Group>

                <Row>
                  <Col md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tenure</Form.Label>
                      <Form.Control
                        type="number"
                        name="tenure"
                        value={formData.tenure}
                        onChange={handleChange}
                        placeholder="Enter tenure"
                        required
                        min="0"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Period</Form.Label>
                      <Form.Select
                        name="tenureType"
                        value={formData.tenureType}
                        onChange={handleChange}
                      >
                        <option value="years">Years</option>
                        <option value="months">Months</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label>Compounding Frequency</Form.Label>
                  <Form.Select
                    name="compounding"
                    value={formData.compounding}
                    onChange={handleChange}
                  >
                    <option value="yearly">Yearly</option>
                    <option value="half-yearly">Half-Yearly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="monthly">Monthly</option>
                  </Form.Select>
                </Form.Group>

                <div className={styles.buttonGroup}>
                  <Button type="submit" variant="primary" className={styles.calculateBtn}>
                    Calculate
                  </Button>
                  <Button type="button" variant="outline-secondary" onClick={resetCalculator}>
                    Reset
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          {result ? (
            <Card className={styles.resultCard}>
              <Card.Body>
                <h4 className={styles.resultTitle}>FD Calculation Results</h4>
                
                <div className={styles.resultSummary}>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Principal Amount:</span>
                    <span className={styles.resultValue}>
                      ₹{result.principal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Interest Earned:</span>
                    <span className={styles.resultValue}>
                      ₹{result.interestEarned.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Maturity Amount:</span>
                    <span className={`${styles.resultValue} ${styles.highlight}`}>
                      ₹{result.maturityAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className={styles.breakdown}>
                  <h6>Investment Breakdown</h6>
                  <Table bordered>
                    <tbody>
                      <tr>
                        <td>Total Investment</td>
                        <td>₹{result.totalInvestment.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td>Total Interest</td>
                        <td>₹{result.interestEarned.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      </tr>
                      <tr className={styles.totalRow}>
                        <td><strong>Maturity Value</strong></td>
                        <td><strong>₹{result.maturityAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong></td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          ) : (
            <Card className={styles.placeholderCard}>
              <Card.Body className="text-center">
                <div className={styles.placeholderIcon}>📊</div>
                <h5>Enter FD Details</h5>
                <p>Fill in the form to see your FD maturity amount and interest earnings</p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      <Row className="mt-5">
        <Col>
          <Card className={styles.infoCard}>
            <Card.Body>
              <h5>About Fixed Deposits</h5>
              <p>
                A Fixed Deposit (FD) is a financial instrument provided by banks and NBFCs 
                which offers investors a higher rate of interest than a regular savings account, 
                until the given maturity date.
              </p>
              <ul>
                <li><strong>Safety:</strong> FDs are considered one of the safest investment options</li>
                <li><strong>Returns:</strong> Offer fixed returns that are not market-linked</li>
                <li><strong>Flexibility:</strong> Choose tenure from 7 days to 10 years</li>
                <li><strong>Loan Facility:</strong> Can avail loans against FDs</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default FDCalculator