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

// 获取用户个性化提示词
app.post('/api/user/prompt/get', async (req, res) => {
  try {
    if (!globalData.user_manage_api) {
      return res.status(500).json({ success: false, message: '用户管理API未配置' });
    }

    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ success: false, message: '用户ID不能为空' });
    }

    console.log('获取用户个性化提示词请求，用户ID:', user_id);

    const formData = new URLSearchParams();
    formData.append('mode', 'get');
    formData.append('user_id', user_id);
    formData.append('target', 'custom_personality');

    const response = await axios.post(globalData.user_manage_api + "/user/custom", formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('获取个性化提示词API响应:', response.data);

    if (response.data && response.data.status === 'success') {
      res.json({
        success: true,
        data: response.data.data || ''
      });
    } else {
      res.json({
        success: true,
        data: '' // 如果没有数据，返回空字符串
      });
    }
  } catch (error) {
    console.error('获取用户个性化提示词失败:', error.message);
    // 如果外部API不可用，返回空数据
    res.json({
      success: true,
      data: ''
    });
  }
});

// 获取用户个性化记忆
app.post('/api/user/memory/get', async (req, res) => {
  try {
    if (!globalData.user_manage_api) {
      return res.status(500).json({ success: false, message: '用户管理API未配置' });
    }

    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ success: false, message: '用户ID不能为空' });
    }

    console.log('获取用户个性化记忆请求，用户ID:', user_id);

    const formData = new URLSearchParams();
    formData.append('mode', 'get');
    formData.append('user_id', user_id);
    formData.append('target', 'custom_memory');

    const response = await axios.post(globalData.user_manage_api + "/user/custom", formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('获取个性化记忆API响应:', response.data);

    if (response.data && response.data.status === 'success') {
      res.json({
        success: true,
        data: response.data.data || ''
      });
    } else {
      res.json({
        success: true,
        data: '' // 如果没有数据，返回空字符串
      });
    }
  } catch (error) {
    console.error('获取用户个性化记忆失败:', error.message);
    // 如果外部API不可用，返回空数据
    res.json({
      success: true,
      data: ''
    });
  }
});

// 更新用户提示词设置
app.post('/api/user/prompt/update', async (req, res) => {
  try {
    if (!globalData.user_manage_api) {
      return res.status(500).json({ success: false, message: '用户管理API未配置' });
    }

    const { user_id, new_text } = req.body;
    if (!user_id) {
      return res.status(400).json({ success: false, message: '用户ID不能为空' });
    }

    console.log('更新用户个性化提示词请求，用户ID:', user_id, '新内容长度:', new_text ? new_text.length : 0);

    const formData = new URLSearchParams();
    formData.append('mode', 'update');
    formData.append('user_id', user_id);
    formData.append('target', 'custom_personality');
    formData.append('new_text', new_text || '');

    const response = await axios.post(globalData.user_manage_api + "/user/custom", formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('更新个性化提示词API响应:', response.data);

    if (response.data && response.data.status === 'success') {
      res.json({
        success: true,
        message: '个性化提示词更新成功'
      });
    } else {
      res.json({
        success: false,
        message: response.data?.message || '更新失败'
      });
    }
  } catch (error) {
    console.error('更新用户个性化提示词失败:', error.message);
    res.status(500).json({
      success: false,
      message: '更新失败，请稍后重试'
    });
  }
});

// 更新用户个性化记忆
app.post('/api/user/memory/update', async (req, res) => {
  try {
    if (!globalData.user_manage_api) {
      return res.status(500).json({ success: false, message: '用户管理API未配置' });
    }

    const { user_id, new_text } = req.body;
    if (!user_id) {
      return res.status(400).json({ success: false, message: '用户ID不能为空' });
    }

    console.log('更新用户个性化记忆请求，用户ID:', user_id, '新内容长度:', new_text ? new_text.length : 0);

    const formData = new URLSearchParams();
    formData.append('mode', 'update');
    formData.append('user_id', user_id);
    formData.append('target', 'custom_memory');
    formData.append('new_text', new_text || '');

    const response = await axios.post(globalData.user_manage_api + "/user/custom", formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('更新个性化记忆API响应:', response.data);

    if (response.data && response.data.status === 'success') {
      res.json({
        success: true,
        message: '个性化记忆更新成功'
      });
    } else {
      res.json({
        success: false,
        message: response.data?.message || '更新失败'
      });
    }
  } catch (error) {
    console.error('更新用户个性化记忆失败:', error.message);
    res.status(500).json({
      success: false,
      message: '更新失败，请稍后重试'
    });
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
            // 直接转发原始chunk数据，保持SSE格式
            const chunkStr = chunk.toString();

            // 检查是否是SSE格式的数据
            if (chunkStr.startsWith('data: ')) {
              // 直接转发SSE格式的数据
              res.write(chunkStr);
            } else {
              // 如果不是SSE格式，包装成SSE格式
              res.write(`data: ${chunkStr}\n\n`);
            }
          });

          response.data.on('end', () => {
            res.write(`data: [DONE]\n\n`);
            res.end();
          });
        } else {
          // AI API不支持流式，模拟流式效果
          const fullResponse = response.data;
          const content = fullResponse.content || fullResponse.message || JSON.stringify(fullResponse);

          // 保持原始格式，按较小的块发送以模拟流式效果
          const chunkSize = 10; // 每次发送10个字符

          for (let i = 0; i < content.length; i += chunkSize) {
            const chunk = content.slice(i, i + chunkSize);
            res.write(`data: ${chunk}\n\n`);
            await new Promise(resolve => setTimeout(resolve, 50)); // 50ms延迟
          }

          res.write(`data: [DONE]\n\n`);
          res.end();
        }

      } catch (apiError) {
        console.error('AI API调用失败:', apiError.message);

        // 直接返回错误，不使用模拟响应
        res.write(`data: ${JSON.stringify({ error: `AI API调用失败: ${apiError.message}`, done: true })}\n\n`);
        res.end();
        return;
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
      res.write(`${JSON.stringify({ error: error.message, done: true })}`);
      res.end();
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// 获取用户的所有的聊天记录会话列表
app.post('/api/user/chat/list', async (req, res) => {
  try {
    console.log('获取会话列表请求，用户ID:', req.body.user_id);

    // 发送的是只能是表单数据，需要有mode和user_id两个参数，mode参数为固定的get_all_list，user_id参数为用户的uuid
    const formData = new URLSearchParams();
    formData.append('mode', 'get_all_list');
    formData.append('user_id', req.body.user_id);

    console.log('发送请求到:', globalData.user_manage_api + "/user/chat_history");
    console.log('请求参数:', formData.toString());

    const response = await axios.post(globalData.user_manage_api + "/user/chat_history", formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('外部API响应:', response.data);

    // 检查响应数据格式
    if (response.data && response.data.data) {
      res.json(response.data.data);
    } else {
      console.log('外部API返回数据格式异常，返回空数组');
      res.json([]);
    }
  } catch (error) {
    console.error('获取会话列表失败:', error.message);

    // 如果外部API不可用，返回一些模拟数据用于测试
    console.log('外部API不可用，返回模拟数据');
    const mockData = [
      {
        session_id: 'session_001',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30分钟前
      },
      {
        session_id: 'session_002',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2小时前
      },
      {
        session_id: 'session_003',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1天前
      }
    ];
    res.json(mockData);
  }
});

// 获取用户特定session_id的聊天记录



// 删除用户的某个聊天记录会话,同样也是表单数据，需要有mode、user_id、session_id三个参数，mode参数为固定的delete_specific，user_id参数为用户的uuid，session_id参数为会话的id
app.post('/api/user/chat/delete', async (req, res) => {
  try {
    console.log('删除会话请求，用户ID:', req.body.user_id, '会话ID:', req.body.session_id);

    const formData = new URLSearchParams();
    formData.append('mode', 'delete_specific');
    formData.append('user_id', req.body.user_id);
    formData.append('session_id', req.body.session_id);

    console.log('发送删除请求到:', globalData.user_manage_api + "/user/chat_history");
    console.log('请求参数:', formData.toString());

    const response = await axios.post(globalData.user_manage_api + "/user/chat_history", formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('删除API响应:', response.data);

    // 检查响应数据格式
    if (response.data && response.data.data) {
      res.json(response.data.data);
    } else {
      res.json({ success: true, message: '删除成功' });
    }
  } catch (error) {
    console.error('删除会话失败:', error.message);

    // 如果外部API不可用，返回模拟的成功响应
    console.log('外部API不可用，返回模拟删除成功响应');
    res.json({ success: true, message: '删除成功（模拟）' });
  }
});



// 获取用户的所有知识库列表
app.post('/api/user/knowledgebase/list', async (req, res) => {
  try {
    if (!globalData.user_manage_api) {
      return res.status(500).json({ success: false, message: '用户管理API未配置' });
    }

    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ success: false, message: '用户ID不能为空' });
    }

    console.log('获取知识库列表请求，用户ID:', user_id);

    const formData = new URLSearchParams();
    formData.append('mode', 'get');
    formData.append('target', 'list');
    formData.append('user_id', user_id);

    console.log('发送请求到:', globalData.user_manage_api + "/user/knowledgebase");
    console.log('请求参数:', formData.toString());

    const response = await axios.post(globalData.user_manage_api + "/user/knowledgebase", formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('知识库列表API响应:', response.data);

    if (response.data && response.data.status === 'success') {
      res.json({
        success: true,
        data: response.data.data || []
      });
    } else {
      res.json({
        success: false,
        message: response.data?.message || '获取知识库列表失败',
        data: []
      });
    }
  } catch (error) {
    console.error('获取知识库列表失败:', error.message);

    // 如果外部API不可用，返回模拟数据用于测试
    console.log('外部API不可用，返回模拟知识库数据');
    const mockData = [
      {
        id: '0a60791f-fe22-4e50-aee5-9d90abdfd2a',
        name: '金融知识库',
        description: '学习金融过程中的知识库',
        document_count: 4
      },
      {
        id: '0a60791f-fe22-4e50-aee5-9d90abdfd2aa',
        name: '法律知识库',
        description: '',
        document_count: 3
      }
    ];
    res.json({
      success: true,
      data: mockData
    });
  }
});

// 删除知识库
app.post('/api/user/knowledgebase/delete', async (req, res) => {
  try {
    if (!globalData.user_manage_api) {
      return res.status(500).json({ success: false, message: '用户管理API未配置' });
    }

    const { user_id, knowledgebase_id } = req.body;
    if (!user_id || !knowledgebase_id) {
      return res.status(400).json({ success: false, message: '用户ID和知识库ID不能为空' });
    }

    console.log('删除知识库请求，用户ID:', user_id, '知识库ID:', knowledgebase_id);

    const formData = new URLSearchParams();
    formData.append('mode', 'delete');
    formData.append('user_id', user_id);
    formData.append('knowledgebase_id', knowledgebase_id);

    console.log('发送删除请求到:', globalData.user_manage_api + "/user/knowledgebase");
    console.log('请求参数:', formData.toString());

    const response = await axios.post(globalData.user_manage_api + "/user/knowledgebase", formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('删除知识库API响应:', response.data);

    if (response.data && response.data.status === 'success') {
      res.json({
        success: true,
        message: '知识库删除成功'
      });
    } else {
      res.json({
        success: false,
        message: response.data?.message || '删除知识库失败'
      });
    }
  } catch (error) {
    console.error('删除知识库失败:', error.message);

    // 如果外部API不可用，返回模拟的成功响应
    console.log('外部API不可用，返回模拟删除成功响应');
    res.json({
      success: true,
      message: '知识库删除成功（模拟）'
    });
  }
});

// 创建/更新知识库
app.post('/api/user/knowledgebase/create', async (req, res) => {
  try {
    if (!globalData.user_manage_api) {
      return res.status(500).json({ success: false, message: '用户管理API未配置' });
    }

    const { user_id, name, description } = req.body;
    if (!user_id || !name) {
      return res.status(400).json({ success: false, message: '用户ID和知识库名称不能为空' });
    }

    console.log('创建知识库请求，用户ID:', user_id, '名称:', name, '描述:', description);

    const formData = new URLSearchParams();
    formData.append('mode', 'update');
    formData.append('user_id', user_id);
    formData.append('name', name);
    formData.append('description', description || '');

    console.log('发送创建请求到:', globalData.user_manage_api + "/user/knowledgebase");
    console.log('请求参数:', formData.toString());

    const response = await axios.post(globalData.user_manage_api + "/user/knowledgebase", formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('创建知识库API响应:', response.data);

    if (response.data && response.data.status === 'success') {
      res.json({
        success: true,
        message: '知识库创建成功'
      });
    } else {
      res.json({
        success: false,
        message: response.data?.message || '创建知识库失败'
      });
    }
  } catch (error) {
    console.error('创建知识库失败:', error.message);

    // 如果外部API不可用，返回模拟的成功响应
    console.log('外部API不可用，返回模拟创建成功响应');
    res.json({
      success: true,
      message: '知识库创建成功（模拟）'
    });
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
