import express from 'express';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import pkg from 'pg';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3035;

// 中间件
app.use(express.json());
app.use(express.static(__dirname));

// 全局变量
let globalData = {
  chat_api_url: '',
  get_model_url: '',
  get_prompt_api_url: '',
  predict_api_url: '',
  user_manage_api: '',
  selectedModelId: '',
  availableModels: [],
  selectedData: null,
  selectedModelName: '',
  prompt: '',
  database: null,
  user_table: null,
};

// 数据库连接池
let pool = null;


// 初始化：加载配置文件
function init() {
  try {
    console.log('正在加载配置文件...');
    const fileContent = fs.readFileSync(path.join(__dirname, "config.yaml"), "utf8");
    const data = yaml.load(fileContent);

    globalData = {
      chat_api_url: data.chat_api,
      get_model_url: data.get_model,
      get_prompt_api_url: data.get_prompt_api,
      predict_api_url: data.predict_api,
      user_manage_api: data.user_manage_api,
      selectedModelId: '',
      availableModels: [],
      selectedData: null,
      selectedModelName: '',
      prompt: '',
      database: data.database,
      user_table: data.user_table,
    };
    console.log('配置加载成功:', globalData);
    
  } catch (error) {
    console.error('配置加载失败:', error);
    globalData = {
      chat_api_url: '',
      get_model_url: '',
      get_prompt_api_url: '',
      predict_api_url: '',
      user_manage_api: '',
      selectedModelId: '',
      availableModels: [],
      selectedData: null,
      selectedModelName: '',
      prompt: '',
    };
  }
}

// 初始化数据库连接
async function initDatabase() {
  try {
    if (!globalData.database) {
      console.log('数据库配置未找到，跳过数据库初始化');
      return;
    }

    console.log('正在初始化数据库连接...');
    pool = new Pool({
      host: globalData.database.host,
      port: globalData.database.port,
      database: globalData.database.database,
      user: globalData.database.username,
      password: globalData.database.password,
    });

    // 测试连接
    const client = await pool.connect();
    console.log('数据库连接成功');
    client.release();

    // 检查并创建用户表
    await checkAndCreateUserTable();

    // 检查并创建用户提示词表
    await checkAndCreateUserPromptTable();

  } catch (error) {
    console.error('数据库初始化失败:', error);
    pool = null;
  }
}

// 检查并创建用户表
async function checkAndCreateUserTable() {
  try {
    const tableName = globalData.user_table?.name || 'zhida_users';

    // 检查表是否存在
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = $1
      );
    `;

    const result = await pool.query(checkTableQuery, [tableName]);
    const tableExists = result.rows[0].exists;

    if (tableExists) {
      console.log(`用户表 ${tableName} 已存在`);
    } else {
      console.log(`用户表 ${tableName} 不存在，正在创建...`);

      // 创建用户表
      const createTableQuery = `
        CREATE TABLE ${tableName} (
          id SERIAL PRIMARY KEY,
          uuid VARCHAR(36) NOT NULL UNIQUE,
          username VARCHAR(50) NOT NULL UNIQUE,
          email VARCHAR(100) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT true
        );
      `;

      await pool.query(createTableQuery);
      console.log(`用户表 ${tableName} 创建成功`);
    }
  } catch (error) {
    console.error('检查/创建用户表失败:', error);
    throw error;
  }
}

// 检查并创建用户提示词表
async function checkAndCreateUserPromptTable() {
  try {
    const tableName = 'user_prompt';

    // 检查表是否存在
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = $1
      );
    `;

    const result = await pool.query(checkTableQuery, [tableName]);
    const tableExists = result.rows[0].exists;

    if (tableExists) {
      console.log(`用户提示词表 ${tableName} 已存在`);
    } else {
      console.log(`用户提示词表 ${tableName} 不存在，正在创建...`);

      // 创建用户提示词表
      const createTableQuery = `
        CREATE TABLE ${tableName} (
          id SERIAL PRIMARY KEY,
          user_uuid VARCHAR(36) NOT NULL,
          username VARCHAR(50) NOT NULL,
          user_prompt TEXT DEFAULT '',
          model_memory TEXT DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_uuid) REFERENCES ${globalData.user_table?.name || 'zhida_users'}(uuid)
        );
      `;

      await pool.query(createTableQuery);
      console.log(`用户提示词表 ${tableName} 创建成功`);
    }
  } catch (error) {
    console.error('检查/创建用户提示词表失败:', error);
    throw error;
  }
}

// 初始化可用模型列表
async function initModels() {
  try {
    const response = await axios.get(globalData.get_model_url);
    const models_list = response.data.data.map(model => {
      return {
        id: model.id,
        name: model.alias
      }
    });
    globalData.availableModels = models_list;
    console.log('获取模型列表成功:', globalData.availableModels);
    return models_list;
  } catch (error) {
    console.error('获取模型失败:', error);
    globalData.availableModels = [];
    return [];
  }
}

// 用户注册
app.post('/api/user/register', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: '数据库连接未初始化' });
    }

    const { username, email, password } = req.body;

    // 基本验证
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: '请填写所有必填字段' });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: '邮箱格式不正确' });
    }

    // 验证密码强度
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: '密码至少需要8位字符' });
    }

    const tableName = globalData.user_table?.name || 'zhida_users';

    // 检查用户名和邮箱是否已存在
    const checkQuery = `SELECT id FROM ${tableName} WHERE username = $1 OR email = $2`;
    const checkResult = await pool.query(checkQuery, [username, email]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({ success: false, message: '用户名或邮箱已存在' });
    }

    // 生成UUID
    const userUuid = uuidv4();

    // 加密密码
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 插入新用户
    const insertQuery = `
      INSERT INTO ${tableName} (uuid, username, email, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, uuid, username, email, created_at
    `;
    const insertResult = await pool.query(insertQuery, [userUuid, username, email, passwordHash]);
    const newUser = insertResult.rows[0];

    console.log('用户注册成功:', { id: newUser.id, username: newUser.username, email: newUser.email });

    res.json({
      success: true,
      message: '注册成功',
      user: {
        id: newUser.id,
        uuid: newUser.uuid,
        username: newUser.username,
        email: newUser.email,
        created_at: newUser.created_at
      }
    });

  } catch (error) {
    console.error('用户注册失败:', error);
    res.status(500).json({ success: false, message: '注册失败，请稍后重试' });
  }
});

// 用户登录
app.post('/api/user/login', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: '数据库连接未初始化' });
    }

    const { email, password } = req.body;

    // 基本验证
    if (!email || !password) {
      return res.status(400).json({ success: false, message: '请填写邮箱和密码' });
    }

    const tableName = globalData.user_table?.name || 'zhida_users';

    // 查找用户
    const query = `SELECT id, uuid, username, email, password_hash, is_active FROM ${tableName} WHERE email = $1`;
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: '邮箱或密码错误' });
    }

    const user = result.rows[0];

    // 检查用户是否激活
    if (!user.is_active) {
      return res.status(401).json({ success: false, message: '账户已被禁用' });
    }

    // 验证密码
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: '邮箱或密码错误' });
    }

    console.log('用户登录成功:', { id: user.id, username: user.username, email: user.email });

    // 生成简单的token（实际项目中应使用JWT）
    const token = `user_${user.id}_${Date.now()}`;

    res.json({
      success: true,
      message: '登录成功',
      token: token,
      user: {
        id: user.id,
        uuid: user.uuid,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('用户登录失败:', error);
    res.status(500).json({ success: false, message: '登录失败，请稍后重试' });
  }
});

// 获取用户提示词设置
app.get('/api/user/prompt/:uuid', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: '数据库连接未初始化' });
    }

    const { uuid } = req.params;

    const query = `SELECT user_prompt, model_memory FROM user_prompt WHERE user_uuid = $1`;
    const result = await pool.query(query, [uuid]);

    if (result.rows.length === 0) {
      // 如果没有记录，返回默认值
      return res.json({
        success: true,
        data: {
          user_prompt: '',
          model_memory: ''
        }
      });
    }

    res.json({
      success: true,
      data: {
        user_prompt: result.rows[0].user_prompt,
        model_memory: result.rows[0].model_memory
      }
    });

  } catch (error) {
    console.error('获取用户提示词失败:', error);
    res.status(500).json({ success: false, message: '获取失败，请稍后重试' });
  }
});

// 更新用户提示词设置
app.post('/api/user/prompt/update', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: '数据库连接未初始化' });
    }

    const { uuid, username, user_prompt, model_memory } = req.body;

    if (!uuid) {
      return res.status(400).json({ success: false, message: '用户UUID不能为空' });
    }

    // 检查记录是否存在
    const checkQuery = `SELECT id FROM user_prompt WHERE user_uuid = $1`;
    const checkResult = await pool.query(checkQuery, [uuid]);

    if (checkResult.rows.length === 0) {
      // 插入新记录
      const insertQuery = `
        INSERT INTO user_prompt (user_uuid, username, user_prompt, model_memory)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      await pool.query(insertQuery, [uuid, username, user_prompt || '', model_memory || '']);
    } else {
      // 更新现有记录
      const updateQuery = `
        UPDATE user_prompt
        SET user_prompt = $2, model_memory = $3, updated_at = CURRENT_TIMESTAMP
        WHERE user_uuid = $1
      `;
      await pool.query(updateQuery, [uuid, user_prompt || '', model_memory || '']);
    }

    res.json({
      success: true,
      message: '设置更新成功'
    });

  } catch (error) {
    console.error('更新用户提示词失败:', error);
    res.status(500).json({ success: false, message: '更新失败，请稍后重试' });
  }
});

// 获取配置
app.get('/api/config', (req, res) => {
  res.json(globalData);
});

// 获取模型列表
app.get('/api/models', async (req, res) => {
  res.json(globalData.availableModels);
});

// 聊天API代理 - 支持流式响应
app.post('/api/chat', async (req, res) => {
  try {
    if (!globalData.chat_api_url) {
      throw new Error('聊天API URL未配置');
    }

    // 检查是否请求流式响应
    const isStreamRequest = req.headers['accept'] === 'text/event-stream' || req.body.stream === true;

    //解析请求体
    const model_id = req.body.model_id;
    const user_id = req.body.user_id;
    const session_id = req.body.session_id;
    const messages = req.body.messages;

    console.log('聊天请求类型:', isStreamRequest ? '流式' : '普通');
    console.log('发送聊天请求到:', globalData.chat_api_url);

    if (isStreamRequest) {
      // 流式响应
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // 将请求体转换为表单数据格式
      const { default: FormData } = await import('form-data');
      const formData = new FormData();
      formData.append('model_id', model_id);
      formData.append('user_id', user_id + '@' + session_id);
      formData.append('messages', JSON.stringify(messages));

      try {
        // 调用真实AI API
        const response = await axios.post(globalData.chat_api_url, formData, {
          responseType: 'stream'
        });

        // 如果AI API支持流式响应，直接转发
        if (response.data && typeof response.data.on === 'function') {
          response.data.on('data', (chunk) => {
            // 转发流式数据
            res.write(`data: ${JSON.stringify({ content: chunk.toString(), done: false })}\n\n`);
          });

          response.data.on('end', () => {
            res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
            res.end();
          });
        } else {
          // AI API不支持流式，模拟流式效果
          const fullResponse = response.data;
          const content = fullResponse.content || fullResponse.message || JSON.stringify(fullResponse);

          // 逐字发送
          for (let i = 0; i < content.length; i++) {
            const char = content[i];
            res.write(`data: ${JSON.stringify({ content: char, done: false })}\n\n`);
            await new Promise(resolve => setTimeout(resolve, 30)); // 30ms延迟
          }

          res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
          res.end();
        }

      } catch (apiError) {
        console.error('AI API调用失败，使用模拟响应:', apiError.message);

        // 如果AI API失败，返回模拟流式响应
        const simulateMessage = `抱歉，AI服务暂时不可用。这是一个模拟响应：您的消息是"${messages[messages.length-1]?.content || '未知'}"`;

        for (let i = 0; i < simulateMessage.length; i++) {
          const char = simulateMessage[i];
          res.write(`data: ${JSON.stringify({ content: char, done: false })}\n\n`);
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
        res.end();
      }

    } else {
      // 普通响应（保持原有逻辑）
      const { default: FormData } = await import('form-data');
      const formData = new FormData();
      formData.append('model_id', model_id);
      formData.append('user_id', user_id + '@' + session_id);
      formData.append('messages', JSON.stringify(messages));

      const response = await axios.post(globalData.chat_api_url, formData);
      res.json(response.data);
    }

  } catch (error) {
    console.error('聊天请求失败:', error);

    if (req.headers['accept'] === 'text/event-stream') {
      res.write(`data: ${JSON.stringify({ error: error.message, done: true })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});


// 预测API代理
app.post('/api/predict', async (req, res) => {
  const response = await axios.post(globalData.predict_api_url, req.body);
  res.json(response.data);
});

// 获取具体提示词 TODO 没加相同的参数时的缓存
app.post('/api/prompt/get', async (req, res) => {
  try {
    if (!globalData.get_prompt_api_url) {
      throw new Error('提示词API URL未配置');
    }

    const prompt_id = req.body.prompt_id;
    const prompt_params = req.body.parameters;
    const request_body = {
      prompt_id: prompt_id,
      parameters: prompt_params
    }

    console.log('发送提示词请求到:', globalData.get_prompt_api_url + "/get");
    console.log('请求体:', request_body);

    const response = await axios.post(globalData.get_prompt_api_url + "/get", request_body);
    res.json(response.data);
  } catch (error) {
    console.error('获取提示词失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 启动服务器
app.listen(PORT, async () => {
  console.log(`\n🚀 服务器启动成功！`);
  console.log(`📍 访问地址: http://localhost:${PORT}`);
  console.log(`📍 登录页面: http://localhost:${PORT}/login.html`);

  // 初始化配置
  init();

  // 初始化数据库
  await initDatabase();

  // 初始化模型列表
  initModels();
});
