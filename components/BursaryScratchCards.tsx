import React, { useState, useEffect } from 'react';
import { apiGetScratchCards, apiSaveScratchCards } from '../services/api';

const generateCardNumber = () => {
    // Generates a 12-digit random number as a string
    return Math.floor(100000000000 + Math.random() * 900000000000).toString();
};

const BursaryScratchCards = () => {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(10);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        const fetchCards = async () => {
            const cardData = await apiGetScratchCards();
            setCards(cardData || []);
            setLoading(false);
        };
        fetchCards();
    }, []);

    const handleGenerate = async () => {
        setGenerating(true);
        const newCards = Array.from({ length: quantity }, () => ({
            id: `card_${Date.now()}_${Math.random()}`,
            pin: generateCardNumber(),
            used: false,
            createdAt: new Date().toISOString(),
        }));
        
        const currentCards = await apiGetScratchCards();
        const updatedCards = [...(currentCards || []), ...newCards];
        await apiSaveScratchCards(updatedCards);
        setCards(updatedCards);
        setGenerating(false);
    };

    if (loading) return <div className="card p-6 text-center">Loading scratch cards...</div>;

    return (
        <div className="card">
            <div className="p-6">
                <h2 className="text-xl font-semibold">Result Checker Scratch Cards</h2>
                 <div className="mt-4 flex items-end space-x-2">
                     <div>
                        <label className="label">Quantity to Generate</label>
                        <input type="number" className="input-field" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min="1" max="100" />
                     </div>
                     <button onClick={handleGenerate} className="btn btn-primary" disabled={generating}>
                        {generating ? 'Generating...' : 'Generate Cards'}
                     </button>
                </div>

                <div className="table-container mt-6">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="th">PIN</th>
                                <th className="th">Status</th>
                                <th className="th">Date Created</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y dark:divide-gray-700">
                            {cards.length === 0 ? (
                                <tr><td colSpan="3" className="td text-center">No scratch cards generated yet.</td></tr>
                            ) : (
                                cards.slice().reverse().map(card => (
                                    <tr key={card.id}>
                                        <td className="td font-mono">{card.pin}</td>
                                        <td className="td">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${card.used ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                {card.used ? 'Used' : 'Unused'}
                                            </span>
                                        </td>
                                        <td className="td">{new Date(card.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BursaryScratchCards;