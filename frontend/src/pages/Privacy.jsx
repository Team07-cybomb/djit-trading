import React from 'react'
import { Container, Row, Col, Card } from 'react-bootstrap'
import styles from './Legal.module.css'

const Privacy = () => {
  return (
    <div className={styles.legalPage}>
      <Container>
        <Row className="mb-5">
          <Col>
            <div className={styles.pageHeader}>
              <h1>Privacy Policy</h1>
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
                    <h2>1. Information We Collect</h2>
                    <p>
                      We collect information you provide directly to us, including when you create an account, enroll in courses, or contact us for support.
                    </p>
                    <ul>
                      <li>Personal identification information (Name, email address, phone number)</li>
                      <li>Account information (username, password)</li>
                      <li>Payment information (processed by secure payment processors)</li>
                      <li>Learning progress and course interactions</li>
                    </ul>
                  </section>

                  <section className={styles.section}>
                    <h2>2. How We Use Your Information</h2>
                    <p>We use the information we collect to:</p>
                    <ul>
                      <li>Provide, maintain, and improve our services</li>
                      <li>Process your transactions and send related information</li>
                      <li>Send you technical notices and support messages</li>
                      <li>Respond to your comments and questions</li>
                      <li>Monitor and analyze trends and usage</li>
                    </ul>
                  </section>

                  <section className={styles.section}>
                    <h2>3. Information Sharing</h2>
                    <p>
                      We do not sell, trade, or rent your personal identification information to others. We may share generic aggregated demographic information not linked to any personal identification information.
                    </p>
                  </section>

                  <section className={styles.section}>
                    <h2>4. Data Security</h2>
                    <p>
                      We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                    </p>
                  </section>

                  <section className={styles.section}>
                    <h2>5. Your Rights</h2>
                    <p>You have the right to:</p>
                    <ul>
                      <li>Access and receive a copy of your personal data</li>
                      <li>Rectify or update your personal data</li>
                      <li>Delete your personal data</li>
                      <li>Restrict or object to our processing of your personal data</li>
                      <li>Data portability</li>
                    </ul>
                  </section>

                  <section className={styles.section}>
                    <h2>6. Cookies</h2>
                    <p>
                      We use cookies and similar tracking technologies to track activity on our service and hold certain information to improve user experience.
                    </p>
                  </section>

                  <section className={styles.section}>
                    <h2>7. Changes to This Policy</h2>
                    <p>
                      We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
                    </p>
                  </section>

                  <section className={styles.section}>
                    <h2>8. Contact Us</h2>
                    <p>
                      If you have any questions about this Privacy Policy, please contact us at privacy@trademasterpro.com.
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

export default Privacy