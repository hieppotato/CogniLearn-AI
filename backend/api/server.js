require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const supabase = require('../config/db');
const axios = require("axios");
const serverless = require("serverless-http");
const app = express();

// Middleware to handle CORS
app.use(cors({
  origin: ["https://cogni-learn-ai-client.vercel.app",
   "http://localhost:5173"],
   allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 600, // cache preflight 10 phút
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],               
}));

// app.options("*", (req, res) => {
//   const origin = req.headers.origin;
//   if (origin && allowlist.includes(origin)) {
//     res.setHeader("Access-Control-Allow-Origin", origin);
//     res.setHeader("Vary", "Origin");
//     res.setHeader("Access-Control-Allow-Credentials", "true");
//   } else {
//     // Nếu không nằm trong allowlist, có thể 204 luôn
//     res.setHeader("Access-Control-Allow-Origin", "null");
//   }
//   res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   res.setHeader("Access-Control-Max-Age", "600");
//   res.status(204).end();
// });

// Middleware /
app.use(express.json());

app.get("/api/questions", async (req, res) => {
  try {
    const { data, error } = await supabase.from("questions").select("*");

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ questions: data });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Lấy câu hỏi theo id
app.get("/api/question/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ question: data });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/create-contest", async (req, res) => {
  try {
    const { name, topics, number, author } = req.body; // dữ liệu gửi từ frontend
    
    if (!name || !Array.isArray(topics)) {
      return res.status(400).json({ error: "Invalid input" });
    }
    const response = await axios.post("https://cognilearn-generator-api.onrender.com/tests/generate", {
      seed_question_ids : topics,
      questions_per_topic : number
    })
    // Insert contest vào Supabase
    const { data, error } = await supabase
      .from("contests")
      .insert([
        { 
          name: name, 
          questions: response.data ,
          author: author.name
        }
      ])
      .select();

    if (error) {
      console.error("Supabase error:", error.message);
      return res.status(500).json({ error: "Database insert failed" });
    }

    res.json({ success: true, contest: data[0] });

  } catch (err) {
    console.error("Server error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/get-contest/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Lấy contest
    const { data: contest, error: contestError } = await supabase
      .from("contests")
      .select("*")
      .eq("id", id)
      .maybeSingle(); 
    if (contestError) throw contestError;
    if (!contest) {
      return res.status(404).json({ error: "Contest không tồn tại" });
    }

    let questions = [];
    if (Array.isArray(contest.questions) && contest.questions.length > 0) {
      const { data: qs, error: qErr } = await supabase
        .from("questions")
        .select("*")
        .in("id", contest.questions);

      if (qErr) throw qErr;
      questions = qs || [];
    }

    res.json({ ...contest, questions });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/get-contests", async (req, res) => {
  const{limit} = req.query;
  try {
    const { data: contests, error } = await supabase
      .from("contests")
      .select("id, name, created_at, author")
      .order("created_at", { ascending: false });
    if (error) throw error;

    res.json(contests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/get-contest-results", async (req, res) => {
  const { limit, userId } = req.query; // lấy user_id từ query

  if (!userId) {
    return res.status(400).json({ error: "Missing user_id" });
  }

  try {
    const query = supabase
      .from("contest_results")
      .select(`
        id,
        contestId,
        point,
        analysis_report,
        created_at,
        name 
      `)
      .eq("userId", userId)
      .order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    const results = data.map((item) => ({
      id: item.id,
      contest_id: item.contestId,
      name: item.name || "Unknown Contest",
      point: item.point,
      analysis_report: item.analysis_report,
      created_at: item.created_at,
    }));

    res.json(results);
  } catch (err) {
    console.error("Error fetching contest results:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/get-contest-result/:contestId", async (req, res) => {
  const {contestId} = req.params;

  if (!contestId) {
    return res.status(400).json({ error: "Missing contestId" });
  }

  try {
    const query = supabase
      .from("contest_results")
      .select(`
        id,
        contestId,
        point,
        analysis_report,
        created_at,
        name, 
        userName  
      `)
      .eq("contestId", contestId)
      .order("point", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    const results = data.map((item) => ({
      id: item.id,
      contest_id: item.contestId,
      name: item.name || "Unknown Contest",
      point: item.point,
      analysis_report: item.analysis_report,
      created_at: item.created_at,
      userName: item.userName
    }));

    res.json(results);
  } catch (err) {
    console.error("Error fetching contest results:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/get-progress/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    // Lấy tối đa 3 bản ghi progress gần nhất
    const { data: progresses, error: progressError } = await supabase
      .from("contest_progress")
      .select("*")
      .eq("userId", userId)
      .order("updated_at", { ascending: false })
      .limit(3);

    if (progressError) throw progressError;

    if (!progresses || progresses.length === 0) {
      return res.status(200).json({ message: "No progress found", data: [] });
    }

    // Lấy danh sách contestId
    const contestIds = progresses.map((p) => p.contestId);

    // Lấy thông tin contests tương ứng
    const { data: contests, error: contestError } = await supabase
      .from("contests")
      .select("id, name")
      .in("id", contestIds);

    if (contestError) throw contestError;

    // Map dữ liệu progress với contest
    const data = progresses.map((p) => {
      const contest = contests.find((c) => c.id === p.contestId);
      return {
        contestId: contest?.id,
        contestName: contest?.name,
        progress: p,
      };
    });

    return res.json({
      message: "Progresses found",
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/contest-progress/:id", async (req, res) => {
  const { id } = req.params; // contestId
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    const { error } = await supabase
      .from("contest_progress")
      .delete()
      .eq("contestId", id)
      .eq("userId", userId);

    if (error) throw error;

    res.json({ message: "Progress deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/session/:sessionId", async(req, res) => {
  const { sessionId } = req.params;

  try{
    const {error} = await supabase
    .from("chat_sessions")
    .delete()
    .eq("id", sessionId);
    if(error) throw error;

    const { err } = await supabase
    .from("chat_messages")
    .delete()
    .eq("sessionId", sessionId);

    res.status(200).json("delete succesful");
    if(err) throw err;
  }catch(error){
    res.status(500).json({err : error.message});
  }
  
})

app.post("/api/contest-result/:id", async (req, res) => {
  try {
    const { id } = req.params; 
    const { name, questions, userId, point } = req.body;

    if (!name || !Array.isArray(questions)) {
      return res.status(400).json({ error: "Invalid input" });
    }

    // 1️⃣ Lưu contest result
    const { data, error } = await supabase
      .from("contest_results")
      .insert([{ 
        contestId: id,   
        name,
        questions,
        userId,
        point
      }])
      .select("id")   
      .single();

    if (error) throw error;
    const contestResultId = data.id;
    
    try {
      const res = await axios.post("https://cognilearn-analyzer-api.onrender.com/analyze", {
        contest_result_id: contestResultId
      });
    } catch (analyzeErr) {
      console.error("Analyzer error:", analyzeErr.message);
 
    }

    res.status(201).json({ 
      message: "Lưu kết quả thành công, đang phân tích...", 
      data 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Có lỗi khi lưu kết quả" });
  }
});
app.get("/api/contest-progress/:contestId", async (req, res) => {
  const { contestId } = req.params;
  const { userId } = req.query;

  try {
    const { data, error } = await supabase
      .from("contest_progress")
      .select("*")
      .eq("contestId", contestId)
      .eq("userId", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116: No rows found
    res.json(data || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/change-password", async (req, res) => {
  const { userId, newPassword } = req.body;

  try {
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// Lưu hoặc cập nhật tiến độ
app.post("/api/contest-progress/:contestId", async (req, res) => {
  const { contestId } = req.params;
  const { userId, answers, currentQIndex, timePerQuestion, totalQuestions, doneQuestions } = req.body;

  try {
    const { data, error } = await supabase
      .from("contest_progress")
      .upsert({
        contestId,
        userId,
        answers,
        currentQIndex,
        timePerQuestion,
        totalQuestions,
        doneQuestions: req.body.doneQuestions,
        updated_at: new Date(),
      }, { onConflict: ["contestId", "userId"] })
       .select("*")
       .single();

    if (error) throw error;
    res.json({ message: "Progress saved", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/signup", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role }, // user_metadata
      },
    });
    
    await supabase.from('profiles').insert([{id: data.user.id, name, role, address:null, phoneNumber:null, level: 0, classes: null, experiences: [ 
      {"name": "Tư duy logic", "point": 0}, 
      {"name" : "Sự cẩn thận", "point": 0}, 
      {"name" : "Sự kiên trì", "point": 0}, 
      {"name" : "Tốc độ học hỏi", "point": 0}
    ]}]);

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({
      message: "User registered successfully",
      user: data.user, // user.user_metadata sẽ chứa name, role
      session: data.session,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}); 

app.post("/api/profile-update", async (req, res) => {
  try {
    const { userInfo } = req.body;

    if (!userInfo.id) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        name : userInfo.name,
        phoneNumber : userInfo.phoneNumber,
        address : userInfo.address,
        classes : userInfo.classes,
      })
      .eq("id", userInfo.id) // "id" là khóa chính của bảng profiles
      .select();

    if (error) throw error;

    res.json({ success: true, profile: data[0] });
  } catch (err) {
    console.error("Update profile error:", err.message);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ---------------- LOGIN ----------------
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return res.status(400).json({ error: error.message });

    res.json({
      message: "Login successful",
      user: data.user,
      session: data.session, // session chứa access_token, refresh_token
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/get-profile", async (req, res) => {
  try {
    // Lấy token từ header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid token" });
    }
    const token = authHeader.split(" ")[1];

    // Xác thực user bằng token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    console.log("Authenticated user:", user);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*") 
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.json({
      user: profile
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/logout", async (req, res) => {
  try {
    const { access_token } = req.body;
    if (!access_token) {
      return res.status(400).json({ error: "Missing access token" });
    }

    // Gọi Supabase để xoá session
    const { error } = await supabase.auth.admin.signOut(access_token);

    if (error) {
      console.warn("⚠️ Supabase logout error:", error.message);
      // Nếu token không hợp lệ hoặc đã hết hạn, coi như logout thành công
      if (
        error.message.includes("Invalid") ||
        error.message.includes("expired") ||
        error.message.includes("not found") || 
        error.message.includes("missing")
      ) {
        return res.json({ message: "Already logged out (token invalid/expired)" });
      }
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/topic-stats-user", async (req, res) => {
  try {
    const { data, error } = await supabase.rpc("get_topic_accuracy_user");
    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch topic stats" });
  }
});

app.get("/api/topic-stats", async (req, res) => {
  try {
    const { data, error } = await supabase.rpc("get_topic_accuracy");
    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch topic stats" });
  }
});

app.get("/api/topics", async (req, res) => {

 try {
    const { data, error } = await supabase.rpc("get_question_topics");
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }

});

app.get("/api/search-topics", async (req, res) => {
  const { query } = req.query; 
  try {
    const { data, error } = await supabase.rpc("search_question_topics", {
      search_query: query,
    });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

//Tạo session mới
app.post("/api/sessions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from("chat_sessions")
      .insert([{ user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy danh sách session của 1 user
app.get("/api/sessions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy session mới nhất
app.get("/api/sessions/last/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) return res.status(500).json({ error: error.message });

  res.json(data[0] || {}); 
});

// Lưu tin nhắn vào session
app.post("/api/sessions/:sessionId/messages", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { sender, content } = req.body;

    const { data, error } = await supabase
      .from("chat_messages")
      .insert([{ session_id: sessionId, sender, content }])
      .select()
      .single();

    if (error) throw error;

    if (sender === "user") {
    const { data: existingMsgs } = await supabase
      .from("chat_messages")
      .select("id")
      .eq("session_id", sessionId);

    if (existingMsgs.length === 1) {
      // tức là đây là message đầu tiên
      await supabase
        .from("chat_sessions")
        .update({ title: content.slice(0, 50) }) // lấy 50 ký tự đầu làm title
        .eq("id", sessionId);
    }
  }

    // update updated_at cho session
    await supabase
      .from("chat_sessions")
      .update({ updated_at: new Date() })
      .eq("id", sessionId);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy tin nhắn của 1 session
app.get("/api/sessions/:sessionId/messages", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;
module.exports.handler = serverless(app);
