import React, { useState } from 'react'
import { Container, Row, Col, Card, Form, Button, Table } from 'react-bootstrap'
import styles from './Calculators.module.css'

const SWPCalculator = () => {
  const [formData, setFormData] = useState({
    initialInvestment: '',
    withdrawalAmount: '',
    withdrawalFrequency: 'monthly',
    expectedReturn: '',
    timePeriod: ''
  })
  
  const [result, setResult] = useState(null)
  const [withdrawalSchedule, setWithdrawalSchedule] = useState([])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const calculateSWP = (e) => {
    e.preventDefault()
    
    const initialInvestment = parseFloat(formData.initialInvestment)
    const withdrawalAmount = parseFloat(formData.withdrawalAmount)
    const annualReturn = parseFloat(formData.expectedReturn) / 100
    const timePeriod = parseFloat(formData.timePeriod)

    let periodsPerYear, totalPeriods
    switch (formData.withdrawalFrequency) {
      case 'monthly':
        periodsPerYear = 12
        break
      case 'quarterly':
        periodsPerYear = 4
        break
      case 'yearly':
        periodsPerYear = 1
        break
      default:
        periodsPerYear = 12
    }

    totalPeriods = timePeriod * periodsPerYear
    const periodicReturn = annualReturn / periodsPerYear

    // Calculate if SWP is sustainable
    let remainingAmount = initialInvestment
    const schedule = []
    let isSustainable = true
    let monthsUntilDepletion = totalPeriods

    for (let period = 1; period <= totalPeriods; period++) {
      // Add returns first
      const returns = remainingAmount * periodicReturn
      remainingAmount += returns
      
      // Then withdraw
      remainingAmount -= withdrawalAmount
      
      schedule.push({
        period,
        returns,
        withdrawal: withdrawalAmount,
        remainingAmount: Math.max(0, remainingAmount)
      })

      if (remainingAmount <= 0 && isSustainable) {
        isSustainable = false
        monthsUntilDepletion = period
        break
      }
    }

    const totalWithdrawals = withdrawalAmount * (isSustainable ? totalPeriods : monthsUntilDepletion)
    const totalReturns = schedule.reduce((sum, item) => sum + item.returns, 0)

    setResult({
      initialInvestment,
      totalWithdrawals,
      totalReturns,
      finalAmount: isSustainable ? remainingAmount : 0,
      isSustainable,
      monthsUntilDepletion
    })
    setWithdrawalSchedule(schedule)
  }

  const resetCalculator = () => {
    setFormData({
      initialInvestment: '',
      withdrawalAmount: '',
      withdrawalFrequency: 'monthly',
      expectedReturn: '',
      timePeriod: ''
    })
    setResult(null)
    setWithdrawalSchedule([])
  }

  const getFrequencyLabel = () => {
    switch (formData.withdrawalFrequency) {
      case 'monthly': return 'Monthly'
      case 'quarterly': return 'Quarterly'
      case 'yearly': return 'Yearly'
      default: return 'Monthly'
    }
  }

  return (
    <Container className={styles.calculatorPage}>
      <Row className="mb-5">
        <Col>
          <div className={styles.pageHeader}>
            <h1>SWP Calculator</h1>
            <p>Calculate your Systematic Withdrawal Plan returns</p>
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg={6}>
          <Card className={styles.calculatorCard}>
            <Card.Body>
              <Form onSubmit={calculateSWP}>
                <Form.Group className="mb-3">
                  <Form.Label>Initial Investment (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    name="initialInvestment"
                    value={formData.initialInvestment}
                    onChange={handleChange}
                    placeholder="Enter initial investment amount"
                    required
                    min="0"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Withdrawal Amount (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    name="withdrawalAmount"
                    value={formData.withdrawalAmount}
                    onChange={handleChange}
                    placeholder="Enter withdrawal amount"
                    required
                    min="0"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Withdrawal Frequency</Form.Label>
                  <Form.Select
                    name="withdrawalFrequency"
                    value={formData.withdrawalFrequency}
                    onChange={handleChange}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </Form.Select>
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

                <Form.Group className="mb-4">
                  <Form.Label>Time Period (Years)</Form.Label>
                  <Form.Control
                    type="number"
                    name="timePeriod"
                    value={formData.timePeriod}
                    onChange={handleChange}
                    placeholder="Enter time period in years"
                    required
                    min="0"
                  />
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
                <h4 className={styles.resultTitle}>SWP Calculation Results</h4>
                
                <div className={styles.resultSummary}>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Initial Investment:</span>
                    <span className={styles.resultValue}>
                      ₹{result.initialInvestment.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Total Withdrawals:</span>
                    <span className={styles.resultValue}>
                      ₹{result.totalWithdrawals.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Total Returns:</span>
                    <span className={styles.resultValue}>
                      ₹{result.totalReturns.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {result.isSustainable ? (
                    <div className={styles.resultItem}>
                      <span className={styles.resultLabel}>Final Amount:</span>
                      <span className={`${styles.resultValue} ${styles.highlight}`}>
                        ₹{result.finalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  ) : (
                    <div className={styles.resultItem}>
                      <span className={styles.resultLabel}>Plan Duration:</span>
                      <span className={`${styles.resultValue} ${styles.warning}`}>
                        {result.monthsUntilDepletion} {getFrequencyLabel().toLowerCase()} withdrawals
                      </span>
                    </div>
                  )}
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Status:</span>
                    <span className={`${styles.resultValue} ${
                      result.isSustainable ? styles.success : styles.danger
                    }`}>
                      {result.isSustainable ? 'Sustainable' : 'Not Sustainable'}
                    </span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ) : (
            <Card className={styles.placeholderCard}>
              <Card.Body className="text-center">
                <div className={styles.placeholderIcon}>💰</div>
                <h5>Enter SWP Details</h5>
                <p>Fill in the form to see your withdrawal plan</p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {withdrawalSchedule.length > 0 && (
        <Row className="mt-4">
          <Col>
            <Card className={styles.breakdownCard}>
              <Card.Body>
                <h5 className="mb-4">Withdrawal Schedule (First 12 periods)</h5>
                <div className="table-responsive">
                  <Table striped bordered hover size="sm">
                    <thead className={styles.tableHeader}>
                      <tr>
                        <th>Period</th>
                        <th>Returns (₹)</th>
                        <th>Withdrawal (₹)</th>
                        <th>Remaining Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawalSchedule.slice(0, 12).map((periodData, index) => (
                        <tr key={index}>
                          <td>{periodData.period}</td>
                          <td>{periodData.returns.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                          <td>{periodData.withdrawal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                          <td>{periodData.remainingAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                {withdrawalSchedule.length > 12 && (
                  <p className="text-muted mt-2">
                    Showing first 12 of {withdrawalSchedule.length} periods
                  </p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Row className="mt-5">
        <Col>
          <Card className={styles.infoCard}>
            <Card.Body>
              <h5>About Systematic Withdrawal Plan (SWP)</h5>
              <p>
                SWP is a facility offered by mutual funds where you can withdraw a fixed amount 
                regularly from your mutual fund investments.
              </p>
              <ul>
                <li><strong>Regular Income:</strong> Get a steady stream of income from your investments</li>
                <li><strong>Tax Efficiency:</strong> Withdrawals are treated as capital returns, making them potentially tax-efficient</li>
                <li><strong>Flexibility:</strong> Choose withdrawal frequency and amount as per your needs</li>
                <li><strong>Wealth Preservation:</strong> Your principal continues to earn returns</li>
                <li><strong>Automatic Process:</strong> Set it once and withdrawals happen automatically</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default SWPCalculator