import React, { useState } from 'react'
import { Container, Row, Col, Card, Accordion } from 'react-bootstrap'
import styles from './FAQ.module.css'

const FAQ = () => {
  const [activeKey, setActiveKey] = useState('0')

  const faqData = [
    {
      question: "What is TradeMaster Pro?",
      answer: "TradeMaster Pro is a comprehensive online learning platform dedicated to trading education. We offer expert-led courses, live trading sessions, and a supportive community to help traders of all levels master the financial markets."
    },
    {
      question: "Do I need any prior trading experience?",
      answer: "No, we welcome traders of all experience levels. Our courses are categorized into Beginner, Intermediate, and Advanced levels. Beginners can start with our foundational courses that cover basic concepts and gradually progress to more advanced topics."
    },
    {
      question: "How do I enroll in a course?",
      answer: "To enroll in a course, simply create an account, browse our course catalog, select the course you're interested in, and click 'Enroll Now'. You'll need to complete the payment process to get immediate access to the course content."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept various payment methods including credit/debit cards, net banking, UPI, and popular digital wallets. All payments are processed through secure payment gateways to ensure your financial information is protected."
    },
    {
      question: "Can I access courses on mobile devices?",
      answer: "Yes, our platform is fully responsive and works seamlessly on desktop, tablet, and mobile devices. You can access your courses anytime, anywhere through our web platform."
    },
    {
      question: "Are the courses self-paced or scheduled?",
      answer: "Most of our courses are self-paced, allowing you to learn at your own convenience. However, we also offer live sessions and webinars with fixed schedules for real-time interaction with instructors."
    },
    {
      question: "What if I'm not satisfied with a course?",
      answer: "We offer a 7-day money-back guarantee for all courses. If you're not satisfied with your purchase, you can request a refund within 7 days of enrollment, no questions asked."
    },
    {
      question: "Do you provide certificates after course completion?",
      answer: "Yes, upon successful completion of any course, you'll receive a verified certificate that you can share on your LinkedIn profile and include in your professional portfolio."
    },
    {
      question: "How do I get help if I have questions during the course?",
      answer: "You can get help through multiple channels: course discussion forums, direct messaging with instructors, live Q&A sessions, and our dedicated student support team. We're committed to ensuring you have the support you need to succeed."
    },
    {
      question: "Can I download course materials?",
      answer: "Yes, most course materials including PDFs, worksheets, and templates are available for download. However, video content is streamed online to protect intellectual property and ensure the best learning experience."
    }
  ]

  return (
    <div className={styles.faqPage}>
      <Container>
        <Row className="mb-5">
          <Col>
            <div className={styles.pageHeader}>
              <h1>Frequently Asked Questions</h1>
              <p>Find answers to common questions about TradeMaster Pro</p>
            </div>
          </Col>
        </Row>

        <Row className="justify-content-center">
          <Col lg={10}>
            <Card className={styles.faqCard}>
              <Card.Body>
                <Accordion activeKey={activeKey} onSelect={(key) => setActiveKey(key)}>
                  {faqData.map((faq, index) => (
                    <Accordion.Item key={index} eventKey={index.toString()} className={styles.accordionItem}>
                      <Accordion.Header className={styles.accordionHeader}>
                        <span className={styles.question}>{faq.question}</span>
                      </Accordion.Header>
                      <Accordion.Body className={styles.accordionBody}>
                        {faq.answer}
                      </Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mt-5">
          <Col className="text-center">
            <div className={styles.contactSection}>
              <h3>Still have questions?</h3>
              <p>Can't find the answer you're looking for? Please reach out to our support team.</p>
              <div className={styles.contactMethods}>
                <div className={styles.contactMethod}>
                  <div className={styles.contactIcon}>📧</div>
                  <h5>Email Support</h5>
                  <p>support@trademasterpro.com</p>
                  <small>Typically replies within 2 hours</small>
                </div>
                <div className={styles.contactMethod}>
                  <div className={styles.contactIcon}>💬</div>
                  <h5>Live Chat</h5>
                  <p>Available 9 AM - 6 PM IST</p>
                  <small>Get instant help from our team</small>
                </div>
                <div className={styles.contactMethod}>
                  <div className={styles.contactIcon}>📞</div>
                  <h5>Phone Support</h5>
                  <p>+91-XXXXX-XXXXX</p>
                  <small>Mon-Fri, 10 AM - 6 PM IST</small>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default FAQ