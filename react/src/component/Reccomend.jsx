import React from 'react';
import GameTile from './GameTile';

const Recommended = (props) => {

    const [games, setGames] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        const fetchRecommended = async () => {
            if (!props.user || !props.user._id) return;
            setLoading(true);
            setError(null);
            try {
                // Get access token
                let accessToken = null;
                try {
                    const refreshRes = await fetch('/api/auth/refresh', {
                        method: 'POST',
                        credentials: 'include',
                    });
                    if (!refreshRes.ok) throw new Error('Failed to refresh token');
                    const refreshData = await refreshRes.json();
                    accessToken = refreshData.accessToken;
                } catch (err) {
                    setError('Error refreshing token');
                    setLoading(false);
                    return;
                }
                const res = await fetch(`/api/users/${props.user._id}/predict`, {
                  method: 'GET',  
                  headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (!res.ok) throw new Error('Failed to fetch recommendations');
                const data = await res.json();
                setGames(data);
            } catch (err) {
                setError(err.message || 'An error occurred');
            } finally {
                setLoading(false);
            }
        };
        fetchRecommended();
    }, [props.user]);

    return (
      <div>
        <h1>Reccomended Games</h1>
        <p>Based on your purchases</p>
        {loading && <div>Loading...</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        <div
          className="card-container"
          style={{
            display: 'flex',
            flexDirection: 'row',
            overflowX: 'auto',
            gap: '1rem',
            paddingBottom: '1rem',
            scrollbarWidth: 'thin',
          }}
        >
          {games.map(game => (
            <GameTile key={game._id} data={game} user={props.user} />
          ))}
        </div>
      </div>
    );
  };

export default Recommended;
