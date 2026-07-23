import React from 'react';
import axios from 'axios';

function LoginView({ 
  username, 
  setUsername, 
  password, 
  setPassword, 
  loading, 
  errorMessage, 
  handleLogin 
}) {

  // // 📝 டிசைனை மாற்றாமல், சப்மிட் செய்யும்போது மட்டும் localStorage-ல் டேட்டாவை ஏற்றும் ஃபங்க்ஷன்
  // const onFormSubmit = async (e) => {
  //   e.preventDefault();
    
  //   try {
  //     // 1. உங்களுடைய பேக்-எண்ட் லாகின் எண்ட்பாயிண்ட்டை கூப்பிடுகிறோம்
  //     // (உங்களுடைய சரியான API URL-ஐ இங்கு பார்த்துக் கொள்ளவும், எ.கா: /api/login அல்லது /api/auth/login)
  //     const res = await axios.post('http://localhost:5000/api/login', { 
  //       username, 
  //       password 
  //     });

  //     if (res.data) {
  //       // API தரும் பயனர் தரவு (User object)
  //       const userData = res.data.user || res.data;
  //       localStorage.setItem('currentUser', JSON.stringify(userData));
  //     }
  //   } catch (err) {
  //     console.error("LocalStorage save patch error:", err);
      
  //     // 💡 ஒருவேளை API-ல் ஏதேனும் சிக்கல் இருந்தால், பாதுகாப்பிற்காக 
  //     // நீங்கள் டைப் செய்த username-ஐயாவது ஆப்ஜெக்ட்டாக லோக்கலில் ஏற்றி விடுகிறோம்!
  //     const fallbackUser = { username: username, role: "User", linked_waiters: [] };
  //     localStorage.setItem('currentUser', JSON.stringify(fallbackUser));
  //   }

  //   // 2. உங்களுடைய மெயின் லாகின் மற்றும் நேவிகேஷன் ஃபங்க்ஷனை அப்படியே ரன் செய்கிறோம்
  //   handleLogin(e);
  // };

  const BACKEND_URL = 'https://pos-backend-kuog.onrender.com';

  const onFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // 🔄 இங்க உங்க சரியான API எண்ட்பாயிண்ட்ட போடுங்க (எ.கா: /api/auth/login)
      const res = await axios.post(`${BACKEND_URL}/api/auth/login`, { 
        username, 
        password 
      });

      // ஏபிஐ சக்சஸ் ஆனால் டேட்டாபேஸ் தரும் உண்மையான ஆப்ஜெக்ட்டை அப்படியே ஏற்றும்
      if (res.data) {
        const userData = res.data.user || res.data;
        localStorage.setItem('currentUser', JSON.stringify(userData));
      }

      handleLogin(e); // உங்க பேரண்ட் லாகின் ஃபங்க்ஷன்
    } catch (err) {
      console.error("Login API Error:", err);
      alert("API Connect ஆகவில்லை! பேக்-எண்ட் URL-ஐ செக் செய்யவும்.");
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center bg-cover bg-center p-4 relative font-sans select-none"
      style={{ 
        backgroundImage: `url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1470&auto=format&fit=crop')` 
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px]"></div>

      <div className="relative z-10 w-full max-w-[430px] bg-white/10 backdrop-blur-3xl rounded-[2rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] border-[2px] border-white/30 px-6 py-12 flex flex-col items-center">
        
        <div className="w-16 h-16 bg-white rounded-2xl flex flex-col items-center justify-center shadow-md mb-6 border border-white/40">
          <span className="text-xl leading-none">👨‍🍳</span>
          <span className="text-xl font-black text-slate-800 tracking-tighter">JB</span>
        </div>

        <h2 className="text-xl font-extrabold text-white mb-6 tracking-wider drop-shadow-md">Login</h2>

        {errorMessage && (
          <div className="w-full max-w-[310px] bg-red-500/80 border border-red-600 text-white text-xs font-semibold py-2 px-3 mb-4 text-center rounded-none shadow">
            {errorMessage}
          </div>
        )}

        {/* 🔄 onSubmit-ல் மட்டும் நம்முடைய இன்டர்செப்டர் ஃபங்க்ஷனை வைத்துள்ளோம் */}
        <form onSubmit={onFormSubmit} className="w-full flex flex-col items-center space-y-4">
          <div className="w-full max-w-[310px]">
            <input 
              type="text" 
              className="w-full px-4 py-2.5 bg-white text-slate-800 outline-none border-2 border-slate-300 text-sm font-medium rounded-none transition-all placeholder-gray-400 focus:border-blue-500"
              placeholder="Username"
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              disabled={loading}
              required 
            />
          </div>

          <div className="w-full max-w-[310px]">
            <input 
              type="password" 
              className="w-full px-4 py-2.5 bg-white text-slate-800 outline-none border-2 border-slate-300 text-sm font-medium rounded-none transition-all placeholder-gray-400 focus:border-blue-500"
              placeholder="Password"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              disabled={loading}
              required 
            />
          </div>

          <div className="w-full max-w-[310px] pt-3">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#5cb85c] hover:bg-[#4cae4c] active:bg-[#449d44] text-white py-2.5 font-bold text-sm tracking-widest rounded-none shadow-md transition-all active:scale-[0.99] uppercase"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginView;