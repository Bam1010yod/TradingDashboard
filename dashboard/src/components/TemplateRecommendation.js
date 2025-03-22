import React, { useState, useEffect } from 'react';
import './TemplateRecommendation.css'; // Create this file for styling

function TemplateRecommendation() {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [session, setSession] = useState('Early Morning');
    const [volatility, setVolatility] = useState('Medium');
    const [templateType, setTemplateType] = useState('ATM');

    const sessions = ['Early Morning', 'Late Morning', 'Early Afternoon', 'Pre-Close'];
    const volatilityLevels = ['Low', 'Medium', 'High'];
    const templateTypes = ['ATM', 'Flazh'];

    // Get current day of week
    const getDayOfWeek = () => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date().getDay()];
    };

    useEffect(() => {
        fetchRecommendations();
    }, [session, volatility, templateType]);

    const fetchRecommendations = async () => {
        setLoading(true);
        setError(null);

        try {
            const dayOfWeek = getDayOfWeek();
            const url = `http://localhost:3008/api/template-recommendations/recommend?type=${templateType}&dayOfWeek=${dayOfWeek}&session=${session}&volatility=${volatility}`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success && data.template) {
                // Extract the template from the response and put it in an array
                setRecommendations([data.template]);
            } else {
                setError(new Error(data.message || 'No template found'));
                setRecommendations([]);
            }
        } catch (error) {
            setError(error);
            setRecommendations([]);
        } finally {
            setLoading(false);
        }
    };

    const applyTemplate = async (templateId) => {
        try {
            const response = await fetch('http://localhost:3008/api/ninjatrader/apply-template', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    templateId,
                    templateType
                }),
            });

            const data = await response.json();

            if (data.success) {
                alert('Template applied successfully to NinjaTrader!');
            } else {
                alert(`Failed to apply template: ${data.message}`);
            }
        } catch (error) {
            console.error('Error applying template:', error);
            alert('Failed to apply template to NinjaTrader. Please check connection.');
        }
    };

    return (
        <div className="template-recommendation-container">
            <h2>Template Recommendations for {getDayOfWeek()}</h2>

            <div className="filters-container">
                <div className="filter-group">
                    <label>Template Type:</label>
                    <select
                        value={templateType}
                        onChange={(e) => setTemplateType(e.target.value)}
                    >
                        {templateTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label>Trading Session:</label>
                    <select
                        value={session}
                        onChange={(e) => setSession(e.target.value)}
                    >
                        {sessions.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label>Volatility Level:</label>
                    <select
                        value={volatility}
                        onChange={(e) => setVolatility(e.target.value)}
                    >
                        {volatilityLevels.map(v => (
                            <option key={v} value={v}>{v}</option>
                        ))}
                    </select>
                </div>

                <button
                    className="refresh-button"
                    onClick={fetchRecommendations}
                    disabled={loading}
                >
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            {loading ? (
                <div className="loading-indicator">Loading recommendations...</div>
            ) : error ? (
                <div className="error-message">Error: {error.message}</div>
            ) : recommendations.length === 0 ? (
                <div className="no-recommendations">
                    No template recommendations found for the current criteria.
                </div>
            ) : (
                <div className="recommendations-list">
                    {recommendations.map(recommendation => (
                        <div key={recommendation._id} className="recommendation-card">
                            <div className="recommendation-details">
                                <h3>{recommendation.name}</h3>
                                <p><strong>Type:</strong> {recommendation.type}</p>
                                <p><strong>Day of Week:</strong> {recommendation.dayOfWeek || 'Any'}</p>
                                <p><strong>Session:</strong> {recommendation.session || 'Any'}</p>
                                <p><strong>Volatility:</strong> {recommendation.volatility || 'Any'}</p>
                                {/* Display other relevant template details here */}
                            </div>
                            <div className="recommendation-actions">
                                <button
                                    className="apply-button"
                                    onClick={() => applyTemplate(recommendation._id)}
                                >
                                    Apply to NinjaTrader
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default TemplateRecommendation;