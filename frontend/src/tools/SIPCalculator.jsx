import React, { useState } from 'react'
import { Container, Row, Col, Card, Form, Button, Table } from 'react-bootstrap'
import styles from './Calculators.module.css'

const SIPCalculator = () => {
  const [formData, setFormData] = useState({
    monthlyInvestment: '',
    expectedReturn: '',
    timePeriod: '',
    timePeriodType: 'years'
  })
  
  const [result, setResult] = useState(null)
  const [yearlyBreakdown, setYearlyBreakdown] = useState([])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const calculateSIP = (e) => {
    e.preventDefault()
    
    const monthlyInvestment = parseFloat(formData.monthlyInvestment)
    const annualReturn = parseFloat(formData.expectedReturn) / 100
    let timePeriod = parseFloat(formData.timePeriod)
    
    // Convert to months for calculation
    if (formData.timePeriodType === 'years') {
      timePeriod = timePeriod * 12
    }

    const monthlyReturn = annualReturn / 12
    const totalMonths = timePeriod

    // Calculate future value of SIP
    const futureValue = monthlyInvestment * 
      ((Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn) * 
      (1 + monthlyReturn)

    const totalInvestment = monthlyInvestment * totalMonths
    const wealthGained = futureValue - totalInvestment

    // Generate yearly breakdown
    const breakdown = []
    let runningInvestment = 0
    let runningValue = 0

    for (let year = 1; year <= Math.ceil(totalMonths / 12); year++) {
      const monthsThisYear = Math.min(12, totalMonths - (year - 1) * 12)
      
      for (let month = 1; month <= monthsThisYear; month++) {
        runningInvestment += monthlyInvestment
        runningValue = (runningValue + monthlyInvestment) * (1 + monthlyReturn)
      }

      breakdown.push({
        year,
        totalInvestment: runningInvestment,
        estimatedReturns: runningValue - runningInvestment,
        totalValue: runningValue
      })
    }

    setResult({
      totalInvestment,
      wealthGained,
      futureValue,
      monthlyInvestment
    })
    setYearlyBreakdown(breakdown)
  }

  const resetCalculator = () => {
    setFormData({
      monthlyInvestment: '',
      expectedReturn: '',
      timePeriod: '',
      timePeriodType: 'years'
    })
    setResult(null)
    setYearlyBreakdown([])
  }

  return (
    <Container className={styles.calculatorPage}>
      <Row className="mb-5">
        <Col>
          <div className={styles.pageHeader}>
            <h1>SIP Calculator</h1>
            <p>Calculate returns on your Systematic Investment Plan</p>
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg={6}>
          <Card className={styles.calculatorCard}>
            <Card.Body>
              <Form onSubmit={calculateSIP}>
                <Form.Group className="mb-3">
                  <Form.Label>Monthly Investment (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    name="monthlyInvestment"
                    value={formData.monthlyInvestment}
                    onChange={handleChange}
                    placeholder="Enter monthly investment amount"
                    required
                    min="0"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Expected Annual Return (%)</Form.Label>
                  <Form.Control
                    type="number"
                    name="expectedReturn"
                    value={formData.expectedReturn}
                    onChange={handleChange}
                    placeholder="Enter expected return rate"
                    required
                    min="0"
                    step="0.01"
                  />
                </Form.Group>

                <Row>
                  <Col md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label>Time Period</Form.Label>
                      <Form.Control
                        type="number"
                        name="timePeriod"
                        value={formData.timePeriod}
                        onChange={handleChange}
                        placeholder="Enter time period"
                        required
                        min="0"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Period</Form.Label>
                      <Form.Select
                        name="timePeriodType"
                        value={formData.timePeriodType}
                        onChange={handleChange}
                      >
                        <option value="years">Years</option>
                        <option value="months">Months</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

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
                <h4 className={styles.resultTitle}>SIP Calculation Results</h4>
                
                <div className={styles.resultSummary}>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Monthly Investment:</span>
                    <span className={styles.resultValue}>
                      ₹{result.monthlyInvestment.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Total Investment:</span>
                    <span className={styles.resultValue}>
                      ₹{result.totalInvestment.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Wealth Gained:</span>
                    <span className={styles.resultValue}>
                      ₹{result.wealthGained.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Future Value:</span>
                    <span className={`${styles.resultValue} ${styles.highlight}`}>
                      ₹{result.futureValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ) : (
            <Card className={styles.placeholderCard}>
              <Card.Body className="text-center">
                <div className={styles.placeholderIcon}>📈</div>
                <h5>Enter SIP Details</h5>
                <p>Fill in the form to see your SIP returns</p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {yearlyBreakdown.length > 0 && (
        <Row className="mt-4">
          <Col>
            <Card className={styles.breakdownCard}>
              <Card.Body>
                <h5 className="mb-4">Yearly Breakdown</h5>
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead className={styles.tableHeader}>
                      <tr>
                        <th>Year</th>
                        <th>Total Investment (₹)</th>
                        <th>Estimated Returns (₹)</th>
                        <th>Total Value (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearlyBreakdown.map((yearData, index) => (
                        <tr key={index}>
                          <td>{yearData.year}</td>
                          <td>{yearData.totalInvestment.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                          <td>{yearData.estimatedReturns.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                          <td>{yearData.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Row className="mt-5">
        <Col>
          <Card className={styles.infoCard}>
            <Card.Body>
              <h5>About Systematic Investment Plan (SIP)</h5>
              <p>
                SIP is an investment method offered by mutual funds where you can invest 
                a fixed amount regularly (monthly/quarterly) instead of making a lump-sum investment.
              </p>
              <ul>
                <li><strong>Rupee Cost Averaging:</strong> Buy more units when prices are low and fewer when prices are high</li>
                <li><strong>Power of Compounding:</strong> Earn returns on your returns over time</li>
                <li><strong>Disciplined Investing:</strong> Regular investments regardless of market conditions</li>
                <li><strong>Flexibility:</strong> Start with as low as ₹500 per month</li>
                <li><strong>Liquidity:</strong> Easy to redeem your investments when needed</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default SIPCalculator