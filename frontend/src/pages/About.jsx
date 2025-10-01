import React from 'react'
import { Container, Row, Col, Card } from 'react-bootstrap'
import styles from './About.module.css'

const About = () => {
  const teamMembers = [
    {
      name: "Rajesh Kumar",
      role: "Founder & CEO",
      experience: "15+ years in Stock Market",
      specialty: "Technical Analysis Expert",
      description: "Former hedge fund manager with proven track record in equity and derivatives trading."
    },
    {
      name: "Priya Sharma",
      role: "Head of Education",
      experience: "12+ years in Financial Education",
      specialty: "Options Trading Specialist",
      description: "Certified financial educator with expertise in creating comprehensive trading curricula."
    },
    {
      name: "Amit Patel",
      role: "Senior Trading Mentor",
      experience: "10+ years in Forex Trading",
      specialty: "Risk Management Expert",
      description: "Specialized in currency markets and international trading strategies."
    },
    {
      name: "Neha Gupta",
      role: "Content Director",
      experience: "8+ years in Financial Content",
      specialty: "Market Research Analyst",
      description: "Creates engaging educational content backed by thorough market research."
    }
  ]

  const stats = [
    { number: "10,000+", label: "Students Trained" },
    { number: "50+", label: "Expert Courses" },
    { number: "15+", label: "Years Experience" },
    { number: "98%", label: "Satisfaction Rate" }
  ]

  return (
    <div className={styles.aboutPage}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <Container>
          <Row className="align-items-center min-vh-100">
            <Col lg={6}>
              <h1 className={styles.heroTitle}>
                About <span className={styles.highlight}>TradeMaster Pro</span>
              </h1>
              <p className={styles.heroSubtitle}>
                We are on a mission to democratize trading education and empower individuals 
                with the knowledge and skills needed to succeed in financial markets.
              </p>
              <div className={styles.heroStats}>
                {stats.map((stat, index) => (
                  <div key={index} className={styles.stat}>
                    <div className={styles.statNumber}>{stat.number}</div>
                    <div className={styles.statLabel}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </Col>
            <Col lg={6}>
              <div className={styles.heroImage}>
                <div className={styles.floatingElement}></div>
                <div className={styles.floatingElement}></div>
                <div className={styles.floatingElement}></div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Mission Section */}
      <section className={styles.missionSection}>
        <Container>
          <Row>
            <Col lg={6} className="mb-4">
              <Card className={styles.missionCard}>
                <Card.Body>
                  <div className={styles.missionIcon}>🎯</div>
                  <h3>Our Mission</h3>
                  <p>
                    To provide accessible, high-quality trading education that transforms beginners 
                    into confident traders and helps experienced traders refine their strategies for 
                    consistent profitability.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={6} className="mb-4">
              <Card className={styles.visionCard}>
                <Card.Body>
                  <div className={styles.visionIcon}>🚀</div>
                  <h3>Our Vision</h3>
                  <p>
                    To become the most trusted platform for trading education worldwide, 
                    creating a community of successful traders who achieve financial independence 
                    through disciplined and informed trading.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Values Section */}
      <section className={styles.valuesSection}>
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className={styles.sectionTitle}>Our Values</h2>
              <p className={styles.sectionSubtitle}>
                The principles that guide everything we do
              </p>
            </Col>
          </Row>
          <Row>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.valueCard}>
                <div className={styles.valueIcon}>📚</div>
                <h4>Quality Education</h4>
                <p>
                  We believe in providing comprehensive, up-to-date content that reflects 
                  current market conditions and trading methodologies.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.valueCard}>
                <div className={styles.valueIcon}>🤝</div>
                <h4>Community First</h4>
                <p>
                  Trading can be lonely. We foster a supportive community where traders 
                  can learn from each other and grow together.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.valueCard}>
                <div className={styles.valueIcon}>💡</div>
                <h4>Innovation</h4>
                <p>
                  We continuously evolve our teaching methods and platform features to 
                  provide the best learning experience possible.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.valueCard}>
                <div className={styles.valueIcon}>🎓</div>
                <h4>Expert-Led</h4>
                <p>
                  All our courses are created and taught by industry professionals with 
                  proven track records in their respective markets.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.valueCard}>
                <div className={styles.valueIcon}>🛡️</div>
                <h4>Risk Awareness</h4>
                <p>
                  We emphasize risk management and responsible trading practices to 
                  protect our students' capital.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.valueCard}>
                <div className={styles.valueIcon}>🌍</div>
                <h4>Accessibility</h4>
                <p>
                  We make quality trading education accessible to everyone, regardless 
                  of their background or experience level.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Team Section */}
      <section className={styles.teamSection}>
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className={styles.sectionTitle}>Meet Our Expert Team</h2>
              <p className={styles.sectionSubtitle}>
                Learn from the best in the industry
              </p>
            </Col>
          </Row>
          <Row>
            {teamMembers.map((member, index) => (
              <Col lg={6} key={index} className="mb-4">
                <Card className={styles.teamCard}>
                  <Card.Body>
                    <Row className="align-items-center">
                      <Col xs={4}>
                        <div className={styles.memberAvatar}>
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      </Col>
                      <Col xs={8}>
                        <h5 className={styles.memberName}>{member.name}</h5>
                        <p className={styles.memberRole}>{member.role}</p>
                        <div className={styles.memberDetails}>
                          <span className={styles.experience}>{member.experience}</span>
                          <span className={styles.specialty}>{member.specialty}</span>
                        </div>
                        <p className={styles.memberDescription}>{member.description}</p>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <Container>
          <Row className="text-center">
            <Col>
              <h2 className={styles.ctaTitle}>Ready to Start Your Trading Journey?</h2>
              <p className={styles.ctaSubtitle}>
                Join thousands of successful traders who transformed their skills with TradeMaster Pro
              </p>
              <div className={styles.ctaButtons}>
                <a href="/courses" className={styles.primaryBtn}>Explore Courses</a>
                <a href="/contact" className={styles.secondaryBtn}>Contact Us</a>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  )
}

export default About