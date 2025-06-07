import os
import loguru
import uvicorn
import datetime
from pathlib import Path
import asyncio
import aiohttp
import asyncpg
import uuid
from loguru import logger
import traceback

from starlette.requests import Request
from starlette.applications import Starlette
from starlette.responses import JSONResponse
from starlette.routing import Route
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware


from account_manage.account_info_module import register_user, delete_user
from global_function.request_info import get_client_ip

# 检查用户涉及的数据库是否正常
from global_function.check_database_setup import check_all_database_setup

# 用户账户的增删改查
from account_manage.overall import (
    create_account,
    delete_account,
    get_user_info,
    update_user_info,
    check_account
)

# 聊天记录的增删改查
from users.chat_history import (
    delete_specific_chat_history,   # 删除用户特定会话的聊天记录
    delete_all_chat_history,        # 删除用户所有会话的聊天记录
    get_all_chat_history,           # 查询用户所有会话的聊天记录
    get_specific_chat_history,      # 查询用户特定会话的聊天记录
    get_all_session_id_list         # 查询用户所有会话的会话id列表
)

# 用户自定义的个性化提示词及记忆的增删改查
from users.custom import (
    delete_custom_personality,
    update_custom_personality,
    get_custom_personality,
    delete_custom_memory,
    update_custom_memory,
    get_custom_memory
)

# 知识库的增删改查
from users.knowledge_base import (
    delete_knowledgebase,
    update_knowledgebase,
    get_all_knowledgebase_list,
    get_knowledgebase_detail
)


log_dir_path = Path(__file__).parent / "logs"
log_dir_path.mkdir(parents=True, exist_ok=True)

async def health(request: Request) -> JSONResponse:
    return JSONResponse({"status": "ok"})

async def account_function(request: Request) -> JSONResponse:
    """负责用户账户的的注册和删除"""

    # parase and validate
    form_data = await request.form()
    mode = str(form_data.get("mode", ""))
    client_ip = await get_client_ip(request)
    if not mode:
        return JSONResponse({"status": "error", "message": "mode is required"})

    if mode == "register":
        try:
            username = str(form_data.get("username", "")).strip()
            email = str(form_data.get("email", "")).strip()
            password = str(form_data.get("password", "")).strip()
            logger.info(f"收到注册请求，来自IP: {client_ip}, 用户名: {username}, 邮箱: {email}")
            result = await create_account(username,email,password)
            return JSONResponse(result)
        except Exception as e:
            # 其他错误
            logger.error(f"用户注册失败: {str(e)}")
            return JSONResponse({
                "success": False,
                "message": "注册失败，请稍后重试"
            }, status_code=500)
    elif mode == "delete":
        try:
            user_id = str(form_data.get("user_id", "")).strip()
            await delete_account(user_id)
            return JSONResponse({"status": "success", "message": f"delete user {user_id} success"})
        except Exception as e:
            logger.error(f"用户删除失败: {str(e)}")
            return JSONResponse({
                "success": False,
                "message": "删除失败，请稍后重试"
            }, status_code=500)
    elif mode == "get":
        user_id = str(form_data.get("user_id", "")).strip()
        target = form_data.get("target")
        if not user_id:
            return JSONResponse({"status": "error", "message": "user_id is required"})
        if not target:
            return JSONResponse({"status": "error", "message": "target is required"})
        try:
            user_info = await get_user_info(user_id, target=target)
            return JSONResponse({"status": "success", "message": f"get user {user_id} info success", "data": user_info})
        except Exception as e:
            logger.error(f"获取用户信息失败: {str(e)}")
            return JSONResponse({
                "success": False,
                "message": f"获取用户信息失败: {str(e)}"
            }, status_code=500)
    elif mode == "update":
        user_id = str(form_data.get("user_id", "")).strip()
        target = form_data.get("target")
        new_value = form_data.get("new_value")
        if not user_id:
            return JSONResponse({"status": "error", "message": "user_id is required"})
        if not target:
            return JSONResponse({"status": "error", "message": "target is required"})
        if not new_value:
            return JSONResponse({"status": "error", "message": "new_value is required"})
        try:
            await update_user_info(user_id, target, new_value)
            return JSONResponse({"status": "success", "message": f"update user {user_id} info success"})
        except Exception as e:
            logger.error(f"更新用户信息失败: {str(e)}")
            return JSONResponse({
                "success": False,
                "message": f"更新用户信息失败: {str(e)}"
            }, status_code=500)
    elif mode == "check":
        try:
            email = str(form_data.get("email", "")).strip()
            password = str(form_data.get("password", "")).strip()
            logger.info(f"收到登录验证请求，来自IP: {client_ip}, 邮箱: {email}")
            result = await check_account(email, password)
            return JSONResponse(result)
        except Exception as e:
            logger.error(f"用户登录验证失败: {str(e)}")
            return JSONResponse({
                "success": False,
                "message": "登录验证失败，请稍后重试"
            }, status_code=500)
    else:
        return JSONResponse({"status": "error", "message": "mode is not valid"})

async def knowledgebase_function(request: Request) -> JSONResponse:
    """负责知识库的增删改查：删除已有知识库（user_id和knowledgebase_id）、创建及更新知识库（user_id和knowledgebase_id,以及多了两个入参name和description，用于给知识库增加名字或者描述）、查询用户的所有知识库的列表，查询某个知识库下的文档列表详情"""
    form_data = await request.form()
    mode = form_data.get("mode")
    user_id = form_data.get("user_id")
    knowledgebase_id = form_data.get("knowledgebase_id","")

    if not user_id:
        return JSONResponse({"status": "error", "message": "user_id is required"})

    if mode == "delete":
        try:
            if not knowledgebase_id:
                return JSONResponse({"status": "error", "message": "knowledgebase_id is required"})
            await delete_knowledgebase(user_id, knowledgebase_id)
            return JSONResponse({"status": "success", "message": f"delete knowledgebase {knowledgebase_id} for user {user_id} success"})
        except:
            return JSONResponse({"status": "error", "message": f"delete knowledgebase failed, error:{traceback.format_exc()}"})
    elif mode == "update":
        name = form_data.get("name")
        description = form_data.get("description")
        try:
            if not knowledgebase_id:
                knowledgebase_id = str(uuid.uuid4())
                await update_knowledgebase(user_id, knowledgebase_id, name="知识库", description=description)
            await update_knowledgebase(user_id, knowledgebase_id, name, description)
            return JSONResponse({"status": "success", "message": f"update knowledgebase {knowledgebase_id} for user {user_id} success"})
        except:
            return JSONResponse({"status": "error", "message": f"update knowledgebase failed, error:{traceback.format_exc()}"})
    elif mode == "get":
        target = form_data.get("target")
        if target == "list":
            try:
                all_knowledgebase_list = await get_all_knowledgebase_list(user_id)
                return JSONResponse({"status": "success", "message": f"get all knowledgebase list for user {user_id} success", "data": all_knowledgebase_list})
            except:
                return JSONResponse({"status": "error", "message": f"get all knowledgebase list failed, error:{traceback.format_exc()}"})
        elif target == "detail":
            knowledgebase_id = form_data.get("knowledgebase_id")
            try:
                specific_knowledgebase = await get_knowledgebase_detail(user_id, knowledgebase_id)
                return JSONResponse({"status": "success", "message": f"get specific knowledgebase {knowledgebase_id} for user {user_id} success", "data": specific_knowledgebase})
            except:
                return JSONResponse({"status": "error", "message": f"get specific knowledgebase failed, error:{traceback.format_exc()}"})
        else:
            return JSONResponse({"status": "error", "message": "target is not valid"})
    else:
        return JSONResponse({"status": "error", "message": "mode is not valid"})


async def document_function(request: Request) -> JSONResponse:
    """负责文档的增删改查：创建（省略）、删除、修改（省略）、查询"""
    pass

async def architecture_function(request: Request) -> JSONResponse:
    """负责架构的增删改查：创建（知识库架构）、删除（知识库架构）、修改（文档所处目录）、查询（知识库架构，某一目录下文档）"""
    pass

async def custom_function(request: Request) -> JSONResponse:
    """负责用户自定义及其身份的增删改查：创建（custom_personality ，custom_memory）、删除（自定义）、修改（自定义）、查询（自定义）[主要是前三个]"""
    
    form_data = await request.form()
    mode = form_data.get("mode")
    user_id = form_data.get("user_id")
    client_ip = await get_client_ip(request)
    if not mode:
        return JSONResponse({"status": "error", "message": "mode is required"})
    if not user_id:
        return JSONResponse({"status": "error", "message": "user_id is required"})

    # 用户注销时，删除用户个性化提示词和个性化记忆
    if mode == "delete":
        try:
            logger.info(f"get request from ip:{client_ip}, mode:{mode}, user_id:{user_id}")
            await delete_custom_personality(user_id)
            await delete_custom_memory(user_id)
            return JSONResponse({"status": "success", "message": f"delete custom personality and memory for user {user_id} success"})
        except:
            return JSONResponse({"status": "error", "message": f"delete custom personality and memory failed, error:{traceback.format_exc()}"})
    # 个性化提示词及记忆的创建与更新
    elif mode == "update":
        target = form_data.get("target")
        new_text = form_data.get("new_text")
        logger.info(f"get request from ip:{client_ip}, mode:{mode}, user_id:{user_id}, target:{target}, new_text:{new_text}")
        if not target:
            return JSONResponse({"status": "error", "message": "target is required"})
        try:
            if target == "custom_personality":
                await update_custom_personality(user_id, new_text)
            elif target == "custom_memory":
                await update_custom_memory(user_id, new_text)
            else:
                return JSONResponse({"status": "error", "message": "target is not valid"})
            return JSONResponse({"status": "success", "message": f"update custom personality for user {user_id} success"})
        except:
            return JSONResponse({"status": "error", "message": f"update custom personality failed, error:{traceback.format_exc()}"})

    elif mode == "get":
        target = form_data.get("target")
        logger.info(f"get request from ip:{client_ip}, mode:{mode}, user_id:{user_id}, target:{target}")
        if not target:
            return JSONResponse({"status": "error", "message": "target is required"})
        try:
            if target == "custom_personality":
                custom_personality = await get_custom_personality(user_id)
                return JSONResponse({"status": "success", "message": f"get custom personality for user {user_id} success", "data": custom_personality})
            elif target == "custom_memory":
                custom_memory = await get_custom_memory(user_id)
                return JSONResponse({"status": "success", "message": f"get custom memory for user {user_id} success", "data": custom_memory})
            else:
                return JSONResponse({"status": "error", "message": "target is not valid"})
        except:
            return JSONResponse({"status": "error", "message": f"get custom personality or memory failed, error:{traceback.format_exc()}"})
    else:
        return JSONResponse({"status": "error", "message": "mode is not valid"})

async def chat_history_function(request: Request) -> JSONResponse:
    """负责用户聊天记录的增删改查：创建不管、删除（删除用户特定会话的聊天记录、删除用户所有会话的聊天记录）、修改（修改用户特定会话的聊天记录）、查询（查询用户特定会话的聊天记录、查询用户所有会话的聊天记录）"""
    form_data = await request.form()
    mode = form_data.get("mode")
    user_id = form_data.get("user_id")
    client_ip = await get_client_ip(request)
    if not mode:
        return JSONResponse({"status": "error", "message": "mode is required"})
    if not user_id:
        return JSONResponse({"status": "error", "message": "user_id is required"})
    logger.info(f"get request from ip:{client_ip}, mode:{mode}, user_id:{user_id}")

    if mode == "delete_specific":
        session_id = form_data.get("session_id")
        if not session_id:
            return JSONResponse({"status": "error", "message": "session_id is required"})
        try:
            await delete_specific_chat_history(user_id, session_id)
            return JSONResponse({"status": "success", "message": f"delete specific chat history {session_id} for user {user_id} success"})
        except:
            return JSONResponse({"status": "error", "message": f"delete specific chat history failed, error:{traceback.format_exc()}"})
    elif mode == "delete_all":
        try:
            await delete_all_chat_history(user_id)
            return JSONResponse({"status": "success", "message": f"delete all chat history for user {user_id} success"})
        except:
            return JSONResponse({"status": "error", "message": f"delete all chat history failed, error:{traceback.format_exc()}"})
    elif mode == "get_all":
        try:
            all_chat_history = await get_all_chat_history(user_id)
            return JSONResponse({"status": "success", "message": f"get all chat history for user {user_id} success", "data": all_chat_history})
        except:
            return JSONResponse({"status": "error", "message": f"get all chat history failed, error:{traceback.format_exc()}"})
    elif mode == "get_all_list":
        try:
            all_session_id_list = await get_all_session_id_list(user_id)
            return JSONResponse({"status": "success", "message": f"get all chat history list for user {user_id} success", "data": all_session_id_list})
        except:
            return JSONResponse({"status": "error", "message": f"get all chat history list failed, error:{traceback.format_exc()}"})
    elif mode == "get_specific":
        session_id = form_data.get("session_id")
        if not session_id:
            return JSONResponse({"status": "error", "message": "session_id is required"})
        try:
            specific_chat_history = await get_specific_chat_history(user_id, session_id)
            return JSONResponse({"status": "success", "message": f"get specific chat history {session_id} for user {user_id} success", "data": specific_chat_history})
        except:
            return JSONResponse({"status": "error", "message": f"get specific chat history failed, error:{traceback.format_exc()}"})
    else:
        return JSONResponse({"status": "error", "message": "mode is not valid"})

# 服务器启动函数，初始化日志和检查和创建数据库基本结构
async def startup():
    log_path = log_dir_path / f"user-management-server-{datetime.datetime.now().strftime('%Y-%m-%d')}.log"
    logger.add(log_path, format="{time} {level} {message} {name}:{function}:{line}", level="INFO")

    logger.info("=====================================")
    logger.info(f"用户管理服务器启动，日志路径：{log_path}")
    logger.info("=====================================")

    await check_all_database_setup()

    logger.info("=====================================")
    logger.info(f"用户管理服务器启动成功，启动时间：{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}，用户账户信息表和用户个性化提示词表检查，用户聊天记录数据库检查，用户资产向量数据库检查成功，用户文件数据库检查成功")
    logger.info("=====================================")

# 服务器关闭函数，关闭日志
async def shutdown():
    try:
        logger.info("=====================================")
        logger.info(f"用户管理服务器关闭，关闭时间：{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=====================================")
        logger.remove()
    except Exception as e:
        pass

# 中间件配置
middleware = [
    Middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
]

# 创建服务器实例
app = Starlette(
        routes=[Route("/health", health, methods=["GET"]),
                Route("/user/account", account_function, methods=["POST"]),
                Route("/user/chat_history", chat_history_function, methods=["POST"]),
                Route("/user/knowledgebase", knowledgebase_function, methods=["POST"]),
                Route("/user/document", document_function, methods=["POST"]),
                Route("/user/architecture", architecture_function, methods=["POST"]),
                Route("/user/custom", custom_function, methods=["POST"])
                ],
        on_startup=[startup],
        on_shutdown=[shutdown],
        middleware=middleware
        )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=12356)