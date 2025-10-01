import React from 'react'
import { Container, Row, Col, Card } from 'react-bootstrap'
import styles from './Legal.module.css'

const Terms = () => {
  return (
    <div className={styles.legalPage}>
      <Container>
        <Row className="mb-5">
          <Col>
            <div className={styles.pageHeader}>
              <h1>Terms & Conditions</h1>
              <p>Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </Col>
        </Row>

        <Row className="justify-content-center">
          <Col lg={10}>
            <Card className={styles.legalCard}>
              <Card.Body>
                <div className={styles.legalContent}>
                  <section className={styles.section}>
                    <h2>1. Acceptance of Terms</h2>
                    <p>
                      By accessing and using TradeMaster Pro ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement.
                    </p>
                  </section>

                  <section className={styles.section}>
                    <h2>2. Use License</h2>
                    <p>
                      Permission is granted to temporarily access the materials on TradeMaster Pro's website for personal, non-commercial transitory viewing only.
                    </p>
                    <ul>
                      <li>You may not modify or copy the materials</li>
                      <li>You may not use the materials for any commercial purpose</li>
                      <li>You may not remove any copyright or proprietary notations</li>
                      <li>You may not transfer the materials to another person</li>
                    </ul>
                  </section>

                  <section className={styles.section}>
                    <h2>3. Course Enrollment and Access</h2>
                    <p>
                      When you enroll in a course on TradeMaster Pro, you get a license from us to view the course via the Platform and no other use.
                    </p>
                    <ul>
                      <li>Courses are licensed, not sold, to you</li>
                      <li>We reserve the right to revoke any license to access and use courses</li>
                      <li>You may not transfer your account access to any other person</li>
                    </ul>
                  </section>

                  <section className={styles.section}>
                    <h2>4. Payment Terms</h2>
                    <p>
                      When you make a payment, you agree to use a valid payment method. We offer a 7-day refund policy for most course purchases.
                    </p>
                  </section>

                  <section className={styles.section}>
                    <h2>5. User Content</h2>
                    <p>
                      Users may post reviews, comments, and other content as long as the content is not illegal, obscene, threatening, defamatory, or otherwise objectionable.
                    </p>
                  </section>

                  <section className={styles.section}>
                    <h2>6. Disclaimer</h2>
                    <p>
                      The materials on TradeMaster Pro's website are provided on an 'as is' basis. Trading involves risk, and past performance does not guarantee future results.
                    </p>
                  </section>

                  <section className={styles.section}>
                    <h2>7. Limitations</h2>
                    <p>
                      In no event shall TradeMaster Pro or its suppliers be liable for any damages arising out of the use or inability to use the materials on our website.
                    </p>
                  </section>

                  <section className={styles.section}>
                    <h2>8. Contact Information</h2>
                    <p>
                      If you have any questions about these Terms, please contact us at legal@trademasterpro.com.
                    </p>
                  </section>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default Terms