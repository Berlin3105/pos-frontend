import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// உங்களுடைய சிஸ்டத்தில் இருக்கும் அனைத்து நேவிகேஷன் மெனுக்களின் பட்டியல்
const AVAILABLE_MENUS = [
    "Dashboard",
    "Product Setup",
    "Ledger Setup",
    "Waiter Setup",
    "Table Setup",
    "Order Entry",
    "Password Setup",
    "Reports"
];

export default function PasswordSetup() {
    // ஸ்டேட்கள் (States)
    const [users, setUsers] = useState([]);
    const [waiters, setWaiters] = useState([]);
    
    // ஃபார்ம் ஸ்டேட்கள்
    const [userId, setUserId] = useState(null); // Edit செய்யும்போது மட்டும் ID இருக்கும்
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Waiter');
    const [permittedMenus, setPermittedMenus] = useState([]);
    const [linkedWaiters, setLinkedWaiters] = useState([]);
    
    const [isEditing, setIsEditing] = useState(false);

    // 1. ஆரம்பத்தில் பயனர்கள் மற்றும் வெயிட்டர்கள் பட்டியலை எடுத்தல்
    useEffect(() => {
        fetchUsers();
        fetchWaiters();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/setup/users`);
            setUsers(res.data);
        } catch (err) {
            alert("Error fetching users: " + err.message);
        }
    };

    const fetchWaiters = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/waiters`);
            setWaiters(res.data);
        } catch (err) {
            alert("Error fetching waiters: " + err.message);
        }
    };

    // 2. மெனு செக்-பாக்ஸ் மாற்றங்களைக் கையாளுதல்
    const handleMenuChange = (menuName) => {
        if (permittedMenus.includes(menuName)) {
            setPermittedMenus(permittedMenus.filter(m => m !== menuName));
        } else {
            setPermittedMenus([...permittedMenus, menuName]);
        }
    };

    // 3. வெயிட்டர் தேர்வைக் கையாளுதல் (Admin vs Waiter Logic)
    const handleWaiterChange = (waiterId) => {
        const id = Number(waiterId);
        if (role === 'Admin') {
            // Admin என்றால் மல்டிபிள் செலக்ட் செய்ய அனுமதிக்கிறோம்
            if (linkedWaiters.includes(id)) {
                setLinkedWaiters(linkedWaiters.filter(wId => wId !== id));
            } else {
                setLinkedWaiters([...linkedWaiters, id]);
            }
        } else {
            // Waiter என்றால் ஒரே ஒரு வெயிட்டர் மட்டும்தான் செலக்ட் ஆக வேண்டும்
            setLinkedWaiters([id]);
        }
    };

    // 4. ரோல் மாறும்போது வெயிட்டர் செலக்ட் ஸ்டேட்டை கிளியர் செய்தல்
    const handleRoleChange = (e) => {
        setRole(e.target.value);
        setLinkedWaiters([]); // ரோல் மாறினால் பழைய தேர்வை ரத்து செய்கிறோம்
    };

    // 5. ஃபார்மை ரீசெட் செய்தல்
    const resetForm = () => {
        setUserId(null);
        setUsername('');
        setPassword('');
        setRole('Waiter');
        setPermittedMenus([]);
        setLinkedWaiters([]);
        setIsEditing(false);
    };

    // 6. சேமிக்க அல்லது அப்டேட் செய்ய (Save or Update / Modify)
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username) return alert("Please enter username");
        if (!isEditing && !password) return alert("Please enter password");

        const payload = {
            username,
            password: password.trim() !== "" ? password : undefined, // எடிட் செய்யும்போது காலியாக இருந்தால் பழைய பாஸ்வேர்ட் அப்படியே இருக்கும்
            role,
            permitted_menus: permittedMenus,
            linked_waiters: linkedWaiters
        };

        try {
            if (isEditing) {
                // UPDATE / MODIFY
                await axios.put(`${API_BASE_URL}/setup/users/${userId}`, payload);
                alert("User Configuration Updated Successfully!");
            } else {
                // CREATE / INSERT
                await axios.post(`${API_BASE_URL}/setup/users`, payload);
                alert("User Configuration Saved Successfully!");
            }
            resetForm();
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.error || "Transaction failed!");
        }
    };

    // 7. எடிட் செய்ய கிரிட்டில் இருந்து டேட்டாவை ஃபார்மிற்கு கொண்டு வருதல் (Edit Click)
    const handleEditClick = (user) => {
        setUserId(user.id);
        setUsername(user.username);
        setPassword(''); // பாதுகாப்பிற்காக பாஸ்வேர்டை காட்டாமல் காலியாக வைக்கிறோம் (மாற்ற விரும்பினால் மட்டும் டைப் செய்யலாம்)
        setRole(user.role);
        setPermittedMenus(user.permitted_menus);
        setLinkedWaiters(user.linked_waiters.map(Number)); // உறுதி செய்ய நம்பராக மாற்றுகிறோம்
        setIsEditing(true);
    };

    // 8. பயனரை நீக்குதல் (Delete Click)
    const handleDeleteClick = async (id) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            try {
                await axios.delete(`${API_BASE_URL}/setup/users/${id}`);
                alert("User Deleted Successfully!");
                fetchUsers();
                if(userId === id) resetForm();
            } catch (err) {
                alert("Delete failed: " + err.message);
            }
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', display: 'flex', gap: '20px' }}>
            
            {/* ⬅️ இடது பக்கம்: யூசர் கிரியேஷன் & பெர்மிஷன் ஃபார்ம் */}
            <div style={{ flex: '1', border: '1px solid #ccc', padding: '20px', borderRadius: '8px', backgroundColor: '#f9f9f9', maxWidth: '450px' }}>
                <h3 style={{ marginTop: 0, color: '#333' }}>{isEditing ? "🔄 Modify User Permission" : "🔑 Add New User & Password Setup"}</h3>
                <form onSubmit={handleSubmit}>
                    
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Username:</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} disabled={isEditing} />
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Password {isEditing && "(Leave blank if no change)"}:</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>User Role:</label>
                        <select value={role} onChange={handleRoleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                            <option value="Waiter">Waiter</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>

                    {/* 🗺️ நேவிகேஷன் மெனு பெர்மிஷன் செக் பாக்ஸ்கள் */}
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Permitted Navigation Menus:</label>
                        <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', borderRadius: '4px', backgroundColor: '#fff' }}>
                            {AVAILABLE_MENUS.map((menu) => (
                                <div key={menu} style={{ marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
                                    <input type="checkbox" id={`menu-${menu}`} checked={permittedMenus.includes(menu)} onChange={() => handleMenuChange(menu)} style={{ marginRight: '8px' }} />
                                    <label htmlFor={`menu-${menu}`}>{menu}</label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 🧑‍🍳 வெயிட்டர் லிங்கிங் லாஜிக் (Admin = Multi Select, Waiter = Single Select) */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                            Link Waiter Name {role === 'Admin' ? '(Select Multiple)' : '(Select Only One)'}:
                        </label>
                        <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', borderRadius: '4px', backgroundColor: '#fff' }}>
                            {waiters.map((w) => {
                                const isChecked = linkedWaiters.includes(Number(w.id));
                                return (
                                    <div key={w.id} style={{ marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
                                        <input 
                                            type={role === 'Admin' ? "checkbox" : "radio"} 
                                            name="waiterSelection"
                                            id={`waiter-${w.id}`} 
                                            checked={isChecked} 
                                            onChange={() => handleWaiterChange(w.id)} 
                                            style={{ marginRight: '8px' }} 
                                        />
                                        <label htmlFor={`waiter-${w.id}`}>{w.waiter_name} {w.tamil_waiter_name ? `(${w.tamil_waiter_name})` : ''}</label>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" style={{ flex: '1', backgroundColor: '#4CAF50', color: 'white', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                            {isEditing ? "Update Configuration" : "Save Configuration"}
                        </button>
                        {isEditing && (
                            <button type="button" onClick={resetForm} style={{ backgroundColor: '#f44336', color: 'white', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* ➡️ வலது பக்கம்: பயனர்களின் விபரங்களைக் காட்டும் கிரிட் (Grid View) */}
            <div style={{ flex: '2', border: '1px solid #ccc', padding: '20px', borderRadius: '8px', backgroundColor: '#fff' }}>
                <h3 style={{ marginTop: 0, color: '#333' }}>📋 Existing Users & Permissions Grid</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f2f2f2', borderBottom: '2px solid #ccc' }}>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Username</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Role</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Allowed Menus</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Linked Waiters Count</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '15px', textAlign: 'center', color: '#888' }}>No users configured yet.</td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} style={{ borderBottom: '1px solid #ddd' }}>
                                    <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold' }}>{user.username}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                        <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '12px', color: '#fff', backgroundColor: user.role === 'Admin' ? '#2196F3' : '#FF9800' }}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd', fontSize: '12px', maxWidth: '200px', wordWrap: 'break-word' }}>
                                        {user.permitted_menus.join(', ') || 'None'}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                        {user.linked_waiters.length} Waiter(s)
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                        <button onClick={() => handleEditClick(user)} style={{ backgroundColor: '#008CBA', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '5px', fontSize: '12px' }}>
                                            Edit
                                        </button>
                                        <button onClick={() => handleDeleteClick(user.id)} style={{ backgroundColor: '#f44336', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    );
}