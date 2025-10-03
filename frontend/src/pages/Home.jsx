// Home.jsx
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import styles from "./Home.module.css";

const Home = () => {
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchFeaturedCourses();
  }, []);

  const fetchFeaturedCourses = async () => {
    try {
      const response = await axios.get("/api/courses?featured=true&limit=3");
      setFeaturedCourses(response.data.courses);
    } catch (error) {
      console.error("Error fetching featured courses:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.homePage}>
      {/* Hero Section with Trading Background */}
      <section className={styles.heroSection}>
        <div className={styles.heroBackground}>
          <div className={styles.heroOverlay}></div>
        </div>
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={10}>
              <div className={styles.heroContent}>
                {/* Trusted Badge */}
                <div className={styles.trustedBadge}>
                  <span className={styles.trustedText}>
                    <span className={styles.checkIcon}>✓</span>
                    Trusted by 10,000+ traders
                  </span>
                </div>

                <h1 className={styles.heroTitle}>
                  DJIT <span className={styles.gradientText}>TRADING</span>
                </h1>
                <p className={styles.heroSubtitle}>
                  Professional Trading Platform for Modern Investors
                </p>
                <div className={styles.taglineContainer}>
                  <p className={styles.tagline}>
                    Trade Smarter with Advanced Analytics
                  </p>
                </div>
                <p className={styles.description}>
                  Access real-time market data, advanced charting tools, and
                  professional trading features in one powerful platform. Learn
                  trading in Tamil with expert guidance.
                </p>
                <div className={styles.heroButtons}>
                  <Button
                    as={Link}
                    to="/courses"
                    className={styles.primaryBtn}
                    size="lg"
                  >
                    <span className={styles.btnIcon}>🎯</span>
                    About Us
                  </Button>
                  <Button
                    as={Link}
                    to="/courses"
                    variant="outline-light"
                    className={styles.secondaryBtn}
                    size="lg"
                  >
                    <span className={styles.btnIcon}>📚</span>
                    View Courses
                  </Button>
                </div>
                <div className={styles.heroStats}>
                  <div className={styles.stat}>
                    <div className={styles.statIcon}>👥</div>
                    <strong>10,000+</strong>
                    <span>Active Students</span>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statIcon}>📊</div>
                    <strong>25+</strong>
                    <span>Smart Courses</span>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statIcon}>🚀</div>
                    <strong>95%</strong>
                    <span>Success Kit</span>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statIcon}>🔄</div>
                    <strong>24/5</strong>
                    <span>Support Available</span>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>

        {/* Animated Elements */}
        <div className={styles.floatingElement1}></div>
        <div className={styles.floatingElement2}></div>
        <div className={styles.floatingElement3}></div>
      </section>

      {/* Why Choose DJIT Trading Section */}
      <section className={styles.featuresSection}>
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  Why Choose DJIT Trading?
                </h2>
                <p className={styles.sectionSubtitle}>
                  Everything you need to succeed in trading, all in one place
                </p>
              </div>
            </Col>
          </Row>
          <Row>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.featureCard}>
                <div className={styles.featureIconWrapper}>
                  <div className={styles.featureIcon}>📚</div>
                </div>
                <h5>Comprehensive Courses</h5>
                <p>
                  From basics to advanced strategies, learn everything about
                  trading in Tamil with structured curriculum.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.featureCard}>
                <div className={styles.featureIconWrapper}>
                  <div className={styles.featureIcon}>👥</div>
                </div>
                <h5>Community Driven</h5>
                <p>
                  Connect with fellow traders, share ideas, and learn from
                  experiences in our active community.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.featureCard}>
                <div className={styles.featureIconWrapper}>
                  <div className={styles.featureIcon}>🛠️</div>
                </div>
                <h5>Financial Tools</h5>
                <p>
                  Access advanced FG, SIP, and SWP calculators for better
                  financial planning and analysis.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.featureCard}>
                <div className={styles.featureIconWrapper}>
                  <div className={styles.featureIcon}>📱</div>
                </div>
                <h5>Mobile Friendly</h5>
                <p>
                  Learn anytime, anywhere with our fully responsive and
                  mobile-optimized trading platform.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.featureCard}>
                <div className={styles.featureIconWrapper}>
                  <div className={styles.featureIcon}>🎯</div>
                </div>
                <h5>Practical Strategies</h5>
                <p>
                  Real-world trading strategies specifically designed for Indian
                  market conditions.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.featureCard}>
                <div className={styles.featureIconWrapper}>
                  <div className={styles.featureIcon}>🔄</div>
                </div>
                <h5>24/5 Support</h5>
                <p>
                  Get instant help when you need it with our dedicated support
                  team during market hours.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Testimonials Section */}
      <section className={styles.testimonialsSection}>
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>What Our Students Say</h2>
                <p className={styles.sectionSubtitle}>
                  Real success stories from real traders who transformed their
                  journey
                </p>
              </div>
            </Col>
          </Row>
          <Row>
            <Col lg={4} className="mb-4">
              <div className={styles.testimonialCard}>
                <div className={styles.quoteIcon}>❝</div>
                <p className={styles.testimonialText}>
                  "DJIT Trading completely transformed my understanding of the
                  market. The Tamil courses made complex concepts incredibly
                  easy to grasp and apply."
                </p>
                <div className={styles.studentInfo}>
                  <div className={styles.studentAvatar}>RK</div>
                  <strong>Rajesh Kumar</strong>
                  <span>Intraday Trader</span>
                </div>
              </div>
            </Col>
            <Col lg={4} className="mb-4">
              <div className={styles.testimonialCard}>
                <div className={styles.quoteIcon}>❝</div>
                <p className={styles.testimonialText}>
                  "The community support and practical strategies helped me
                  achieve consistent profits. Highly recommended for serious
                  traders!"
                </p>
                <div className={styles.studentInfo}>
                  <div className={styles.studentAvatar}>PS</div>
                  <strong>Priya Shankar</strong>
                  <span>Options Trader</span>
                </div>
              </div>
            </Col>
            <Col lg={4} className="mb-4">
              <div className={styles.testimonialCard}>
                <div className={styles.quoteIcon}>❝</div>
                <p className={styles.testimonialText}>
                  "Best investment I ever made was in DJIT courses. The
                  technical analysis module alone is worth the entire course
                  fee."
                </p>
                <div className={styles.studentInfo}>
                  <div className={styles.studentAvatar}>VP</div>
                  <strong>Vikram Patel</strong>
                  <span>Technical Analyst</span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Download App Section */}
      <section className={styles.downloadAppSection}>
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Trade On The Go</h2>
                <p className={styles.sectionSubtitle}>
                  Download our mobile app and never miss a trading opportunity
                </p>
              </div>
            </Col>
          </Row>
          <Row className="align-items-center">
            <Col lg={6} className="mb-5 mb-lg-0">
              <div className={styles.appContent}>
                <div className={styles.appFeatures}>
                  <div className={styles.appFeature}>
                    <div className={styles.featureIcon}>📱</div>
                    <div>
                      <strong>Real-time Alerts</strong>
                      <span>Instant market notifications</span>
                    </div>
                  </div>
                  <div className={styles.appFeature}>
                    <div className={styles.featureIcon}>📊</div>
                    <div>
                      <strong>Live Charts</strong>
                      <span>Advanced technical analysis</span>
                    </div>
                  </div>
                  <div className={styles.appFeature}>
                    <div className={styles.featureIcon}>⚡</div>
                    <div>
                      <strong>Quick Orders</strong>
                      <span>Execute trades in seconds</span>
                    </div>
                  </div>
                </div>

                <div className={styles.downloadButtons}>
                  <a href="#" className={styles.storeButton}>
                    <div className={styles.storeIcon}>
                      <span className={styles.appleIcon}></span>
                    </div>
                    <div className={styles.storeText}>
                      <span>Download on the</span>
                      <strong>App Store</strong>
                    </div>
                  </a>

                  <a href="#" className={styles.storeButton}>
                    <div className={styles.storeIcon}>
                      <span className={styles.playIcon}></span>
                    </div>
                    <div className={styles.storeText}>
                      <span>Get it on</span>
                      <strong>Google Play</strong>
                    </div>
                  </a>
                </div>
              </div>
            </Col>

            <Col lg={6}>
              <div className={styles.phoneMockup}>
                <div className={styles.phoneFrame}>
                  <div className={styles.phoneScreen}>
                    <div className={styles.screenContent}>
                      <div className={styles.appHeader}>
                        <div className={styles.appLogo}>DJIT</div>
                        <div className={styles.marketStatus}>
                          <span className={styles.liveDot}></span>
                          Live Market
                        </div>
                      </div>
                      <div className={styles.stockTicker}>
                        <div className={styles.stockItem}>
                          <span>NIFTY</span>
                          <span className={styles.stockPrice}>22,415.25</span>
                          <span className={styles.stockChange}>+1.2%</span>
                        </div>
                        <div className={styles.stockItem}>
                          <span>SENSEX</span>
                          <span className={styles.stockPrice}>73,805.64</span>
                          <span className={styles.stockChange}>+0.8%</span>
                        </div>
                      </div>
                      <div className={styles.chartPlaceholder}></div>
                      <div className={styles.quickActions}>
                        <button className={styles.actionBtn}>Buy</button>
                        <button className={styles.actionBtn}>Sell</button>
                        <button className={styles.actionBtn}>Chart</button>
                        <button className={styles.actionBtn}>Watchlist</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.floatingNotification}>
                  <div className={styles.notificationIcon}>📈</div>
                  <div className={styles.notificationText}>
                    <strong>Alert: NIFTY</strong>
                    <span>Breakout detected</span>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaBackground}>
          <div className={styles.ctaOverlay}></div>
        </div>
        <Container>
          <Row className="text-center">
            <Col lg={8} className="mx-auto">
              <div className={styles.ctaContent}>
                <h2 className={styles.ctaTitle}>
                  Ready to Master Stock Market Trading?
                </h2>
                <p className={styles.ctaSubtitle}>
                  Join 10,000+ successful traders who transformed their skills
                  and achieved financial freedom with DJIT Trading
                </p>
                <div className={styles.ctaButtons}>
                  <Button
                    as={Link}
                    to="/courses"
                    size="lg"
                    className={styles.primaryCta}
                  >
                    <span className={styles.btnIcon}>🚀</span>
                    Explore All Courses
                  </Button>
                  <Button
                    as={Link}
                    to="/courses?category=beginner"
                    variant="outline-light"
                    size="lg"
                    className={styles.secondaryCta}
                  >
                    <span className={styles.btnIcon}>📖</span>
                    Start Growing Today
                  </Button>
                </div>
                <div className={styles.trustBadges}>
                  <span className={styles.trustBadgeItem}>
                    <span className={styles.badgeIcon}>🔒</span>
                    Premium Content
                  </span>
                  <span className={styles.trustBadgeItem}>
                    <span className={styles.badgeIcon}>⭐</span>
                    4.8/5 Rating
                  </span>
                  <span className={styles.trustBadgeItem}>
                    <span className={styles.badgeIcon}>💼</span>
                    10K+ Students
                  </span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Home;
