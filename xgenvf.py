

import hmac
import hashlib
import requests
import string
import random
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad
import json
import codecs
import time
from datetime import datetime
from colorama import Fore, Style, init
import urllib3
import os
import sys
import base64
import signal
import threading
import psutil
import re
import subprocess
import importlib
import asyncio
from cfonts import render, say
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes, MessageHandler, filters
from telegram.request import HTTPXRequest
import concurrent.futures
import httpx

init(autoreset=True)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ===============================
# ULTRA TURBO SPEED CONFIGURATION
# ===============================
MAX_WORKERS = 150  # EXTREME parallel processing (Increased for speed)
ULTRA_FAST_MODE = True
REQUEST_TIMEOUT = 5  # Faster timeout to skip bad proxies quickly
BATCH_SIZE = 50  # Process accounts in large batches

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN = "8583304774:AAHB9byzz9DLckLZgsv__nXyI0qHVZV9_ys"
ADMIN_IDS = [5958976457, 8028357250]
# Global variables
user_sessions = {}
current_generation = {}
USE_PROXIES = False


def get_random_color():
    colors = [Fore.LIGHTGREEN_EX, Fore.LIGHTYELLOW_EX, Fore.LIGHTWHITE_EX,
              Fore.LIGHTBLUE_EX, Fore.LIGHTCYAN_EX, Fore.LIGHTMAGENTA_EX]
    return random.choice(colors)


class Colors:
    BRIGHT = Style.BRIGHT
    RESET = Style.RESET_ALL


EXIT_FLAG = False
SUCCESS_COUNTER = 0
TARGET_ACCOUNTS = 0
LOCK = threading.Lock()

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_FOLDER = os.path.join(CURRENT_DIR, "BANECIPHERXR-ERA")
TOKENS_FOLDER = os.path.join(BASE_FOLDER, "TOKENS-JWT")
ACCOUNTS_FOLDER = os.path.join(BASE_FOLDER, "ACCOUNTS")
RARE_ACCOUNTS_FOLDER = os.path.join(BASE_FOLDER, "RARE ACCOUNTS")
GHOST_FOLDER = os.path.join(BASE_FOLDER, "GHOST")
GHOST_ACCOUNTS_FOLDER = os.path.join(GHOST_FOLDER, "ACCOUNTS")
GHOST_RARE_FOLDER = os.path.join(GHOST_FOLDER, "RAREACCOUNT")

# Create all necessary folders
os.makedirs(BASE_FOLDER, exist_ok=True)
os.makedirs(TOKENS_FOLDER, exist_ok=True)
os.makedirs(ACCOUNTS_FOLDER, exist_ok=True)
os.makedirs(RARE_ACCOUNTS_FOLDER, exist_ok=True)
os.makedirs(GHOST_FOLDER, exist_ok=True)
os.makedirs(GHOST_ACCOUNTS_FOLDER, exist_ok=True)
os.makedirs(GHOST_RARE_FOLDER, exist_ok=True)

for score in [3, 4, 5, 6, 7, 8]:
    os.makedirs(os.path.join(RARE_ACCOUNTS_FOLDER, str(score)), exist_ok=True)
    os.makedirs(os.path.join(GHOST_RARE_FOLDER, str(score)), exist_ok=True)

# ALL REGIONS INCLUDING BR
REGION_LANG = {"ME": "ar", "IND": "hi", "ID": "id", "VN": "vi", "TH": "th",
               "BD": "bn", "PK": "ur", "TW": "zh", "CIS": "ru", "SAC": "es", "BR": "pt"}
REGION_URLS = {"IND": "https://client.ind.freefiremobile.com/", "ID": "https://clientbp.ggblueshark.com/", "BR": "https://client.us.freefiremobile.com/", "ME": "https://clientbp.common.ggbluefox.com/", "VN": "https://clientbp.ggblueshark.com/", "TH": "https://clientbp.common.ggbluefox.com/",
               "CIS": "https://clientbp.ggblueshark.com/", "BD": "https://clientbp.ggblueshark.com/", "PK": "https://clientbp.ggblueshark.com/", "SG": "https://clientbp.ggblueshark.com/", "SAC": "https://client.us.freefiremobile.com/", "TW": "https://clientbp.ggblueshark.com/"}
hex_key = "32656534343831396539623435393838343531343130363762323831363231383734643064356437616639643866376530306331653534373135623764316533"
key = bytes.fromhex(hex_key)

# UPDATED WORKING HTTP PROXIES
PROXY_LIST = [
    "http://142.111.67.146:5611",
    "http://142.111.67.146:5611",
    "http://216.10.27.159:6837",
    "http://84.247.60.125:6095",
    "http://64.137.96.74:6641",
    "http://198.105.121.200:6462",
    "http://198.105.121.200:6462",
    "http://107.172.163.27:6543",
    "http://107.172.163.27:6543",
    "http://198.23.239.134:6540",
    "http:/198.23.239.134:6540",
    "http://23.95.150.145:6114",
    "http://31.59.20.176:6754",
    "http://142.111.67.146:5611",
    "http://142.111.67.146:5611",
    "http://216.10.27.159:6837",
    "http://84.247.60.125:6095",
    "http://64.137.96.74:6641",
    "http://198.105.121.200:6462",
    "http://198.105.121.200:6462",
    "http://107.172.163.27:6543",
    "http://107.172.163.27:6543",
    "http://198.23.239.134:6540",
    "http:/198.23.239.134:6540",
    "http://23.95.150.145:6114",
    "http://31.59.20.176:6754"
]

# Add these variables to track working proxies
WORKING_PROXIES = []
FAILED_PROXIES = set()
PROXY_VERIFIED = False
CURRENT_PROXY_INDEX = 0
PROXY_LOCK = threading.Lock()

# ===============================
# ULTRA TURBO SPEED OPTIMIZATION FUNCTIONS
# ===============================


def ultra_turbo_optimize_requests():
    """ULTRA TURBO optimized requests session for MAXIMUM speed"""
    session = requests.Session()

    # EXTREME connection pooling
    adapter = requests.adapters.HTTPAdapter(
        pool_connections=50000,
        pool_maxsize=50000,
        max_retries=0,  # No retries for maximum speed
        pool_block=False
    )
    session.mount('http://', adapter)
    session.mount('https://', adapter)

    # Remove all delays
    session.headers.update({
        'Connection': 'keep-alive',
        'Keep-Alive': 'timeout=60, max=10000'
    })
    return session


# Global ultra-turbo-optimized session
TURBO_SESSION = ultra_turbo_optimize_requests()


def no_delay():
    """NO DELAY for maximum speed"""
    return  # No sleep at all!


def ultra_turbo_create_acc(region, account_name, password_prefix, is_ghost=False):
    """ULTRA TURBO account creation - MAXIMUM SPEED"""
    if EXIT_FLAG:
        return None
    try:
        password = generate_custom_password(password_prefix)
        data = f"password={password}&client_type=2&source=2&app_id=100067"
        message = data.encode('utf-8')
        signature = hmac.new(key, message, hashlib.sha256).hexdigest()

        url = "https://100067.connect.garena.com/oauth/guest/register"
        headers = {
            "User-Agent": "GarenaMSDK/4.0.19P8(ASUS_Z01QD ;Android 12;en;US;)",
            "Authorization": "Signature " + signature,
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept-Encoding": "gzip",
            "Connection": "Keep-Alive"
        }

        proxies = get_next_proxy() if USE_PROXIES else None

        # Reduced timeout to fail faster on bad proxies
        response = TURBO_SESSION.post(
            url, headers=headers, data=data, timeout=REQUEST_TIMEOUT, verify=False, proxies=proxies)

        if response.status_code == 200 and 'uid' in response.json():
            uid = response.json()['uid']
            return ultra_turbo_token(uid, password, region, account_name, password_prefix, is_ghost)
        return None
    except Exception:
        return None


def ultra_turbo_token(uid, password, region, account_name, password_prefix, is_ghost=False):
    """ULTRA TURBO token generation"""
    if EXIT_FLAG:
        return None
    try:
        url = "https://100067.connect.garena.com/oauth/guest/token/grant"
        headers = {
            "Accept-Encoding": "gzip",
            "Connection": "Keep-Alive",
            "Content-Type": "application/x-www-form-urlencoded",
            "Host": "100067.connect.garena.com",
            "User-Agent": "GarenaMSDK/4.0.19P8(ASUS_Z01QD ;Android 12;en;US;)",
        }
        body = {
            "uid": uid,
            "password": password,
            "response_type": "token",
            "client_type": "2",
            "client_secret": key,
            "client_id": "100067"
        }

        proxies = get_next_proxy() if USE_PROXIES else None

        response = TURBO_SESSION.post(
            url, headers=headers, data=body, timeout=REQUEST_TIMEOUT, verify=False, proxies=proxies)

        if response.status_code == 200 and 'open_id' in response.json():
            open_id = response.json()['open_id']
            access_token = response.json()["access_token"]

            result = encode_string(open_id)
            field = to_unicode_escaped(result['field_14'])
            field = codecs.decode(field, 'unicode_escape').encode('latin1')

            return ultra_turbo_major_register(access_token, open_id, field, uid, password, region, account_name, password_prefix, is_ghost)
        return None
    except Exception:
        return None


def ultra_turbo_major_register(access_token, open_id, field, uid, password, region, account_name, password_prefix, is_ghost=False):
    """ULTRA TURBO major register"""
    if EXIT_FLAG:
        return None

    try:
        if is_ghost:
            url = "https://loginbp.ggblueshark.com/MajorRegister"
        else:
            if region.upper() in ["ME", "TH"]:
                url = "https://loginbp.common.ggbluefox.com/MajorRegister"
            else:
                url = "https://loginbp.ggblueshark.com/MajorRegister"

        name = generate_random_name(account_name)

        headers = {
            "Accept-Encoding": "gzip",
            "Authorization": "Bearer",
            "Connection": "Keep-Alive",
            "Content-Type": "application/x-www-form-urlencoded",
            "Expect": "100-continue",
            "Host": "loginbp.ggblueshark.com" if is_ghost or region.upper() not in ["ME", "TH"] else "loginbp.common.ggbluefox.com",
            "ReleaseVersion": "Ob51",
            "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 9; ASUS_I005DA Build/PI)",
            "X-GA": "v1 1",
            "X-Unity-Version": "2018.4."
        }

        lang_code = "pt" if is_ghost else REGION_LANG.get(region.upper(), "en")
        payload = {
            1: name,
            2: access_token,
            3: open_id,
            5: 102000007,
            6: 4,
            7: 1,
            13: 1,
            14: field,
            15: lang_code,
            16: 1,
            17: 1
        }

        payload_bytes = CrEaTe_ProTo(payload)
        encrypted_payload = E_AEs(payload_bytes.hex())

        proxies = get_next_proxy() if USE_PROXIES else None

        response = TURBO_SESSION.post(
            url, headers=headers, data=encrypted_payload, verify=False, timeout=REQUEST_TIMEOUT, proxies=proxies)

        if response.status_code == 200:
            login_result = ultra_turbo_major_login(
                uid, password, access_token, open_id, region, is_ghost)
            account_id = login_result.get("account_id", "N/A")
            jwt_token = login_result.get("jwt_token", "")

            account_data = {
                "uid": uid,
                "password": password,
                "name": name,
                "region": "GHOST" if is_ghost else region,
                "status": "success",
                "account_id": account_id,
                "jwt_token": jwt_token
            }

            return account_data
        return None

    except Exception:
        return None


def ultra_turbo_major_login(uid, password, access_token, open_id, region, is_ghost=False):
    """ULTRA TURBO major login"""
    try:
        lang = "pt" if is_ghost else REGION_LANG.get(region.upper(), "en")
        lang_b = lang.encode("ascii")

        if is_ghost:
            url = "https://loginbp.ggblueshark.com/MajorLogin"
        elif region.upper() in ["ME", "TH"]:
            url = "https://loginbp.common.ggbluefox.com/MajorLogin"
        else:
            url = "https://loginbp.ggblueshark.com/MajorLogin"

        headers = {
            "Accept-Encoding": "gzip",
            "Authorization": "Bearer",
            "Connection": "Keep-Alive",
            "Content-Type": "application/x-www-form-urlencoded",
            "Expect": "100-continue",
            "Host": "loginbp.ggblueshark.com" if is_ghost or region.upper() not in ["ME", "TH"] else "loginbp.common.ggbluefox.com",
            "ReleaseVersion": "Ob51",
            "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 9; ASUS_I005DA Build/PI)",
            "X-GA": "v1 1",
            "X-Unity-Version": "2018.4.11f1"
        }

        payload = b'\x1a\x132025-08-30 05:19:21"\tfree fire(\x01:\x081.114.13B2Android OS 9 / API-28 (PI/rel.cjw.20220518.114133)J\x08HandheldR\nATM MobilsZ\x04WIFI`\xb6\nh\xee\x05r\x03300z\x1fARMv7 VFPv3 NEON VMH | 2400 | 2\x80\x01\xc9\x0f\x8a\x01\x0fAdreno (TM) 640\x92\x01\rOpenGL ES 3.2\x9a\x01+Google|dfa4ab4b-9dc4-454e-8065-e70c733fa53f\xa2\x01\x0e105.235.139.91\xaa\x01\x02'+lang_b + \
            b'\xb2\x01 1d8ec0240ede109973f3321b9354b44d\xba\x01\x014\xc2\x01\x08Handheld\xca\x01\x10Asus ASUS_I005DA\xea\x01@afcfbf13334be42036e4f742c80b956344bed760ac91b3aff9b607a610ab4390\xf0\x01\x01\xca\x02\nATM Mobils\xd2\x02\x04WIFI\xca\x03 7428b253defc164018c604a1ebbfebdf\xe0\x03\xa8\x81\x02\xe8\x03\xf6\xe5\x01\xf0\x03\xaf\x13\xf8\x03\x84\x07\x80\x04\xe7\xf0\x01\x88\x04\xa8\x81\x02\x90\x04\xe7\xf0\x01\x98\x04\xa8\x81\x02\xc8\x04\x01\xd2\x04=/data/app/com.dts.freefireth-PdeDnOilCSFn37p1AH_FLg==/lib/arm\xe0\x04\x01\xea\x04_2087f61c19f57f2af4e7feff0b24d9d9|/data/app/com.dts.freefireth-PdeDnOilCSFn37p1AH_FLg==/base.apk\xf0\x04\x03\xf8\x04\x01\x8a\x05\x0232\x9a\x05\n2019118692\xb2\x05\tOpenGLES2\xb8\x05\xff\x7f\xc0\x05\x04\xe0\x05\xf3F\xea\x05\x07android\xf2\x05pKqsHT5ZLWrYljNb5Vqh//yFRlaPHSO9NWSQsVvOmdhEEn7W+VHNUK+Q+fduA3ptNrGB0Ll0LRz3WW0jOwesLj6aiU7sZ40p8BfUE/FI/jzSTwRe2\xf8\x05\xfb\xe4\x06\x88\x06\x01\x90\x06\x01\x9a\x06\x014\xa2\x06\x014\xb2\x06"GQ@O\x00\x0e^\x00D\x06UA\x0ePM\r\x13hZ\x07T\x06\x0cm\\V\x0ejYV;\x0bU5'

        data = payload
        data = data.replace(
            b'afcfbf13334be42036e4f742c80b956344bed760ac91b3aff9b607a610ab4390', access_token.encode())
        data = data.replace(
            b'1d8ec0240ede109973f3321b9354b44d', open_id.encode())

        d = encrypt_api(data.hex())
        final_payload = bytes.fromhex(d)

        proxies = get_next_proxy() if USE_PROXIES else None

        response = TURBO_SESSION.post(
            url, headers=headers, data=final_payload, verify=False, timeout=REQUEST_TIMEOUT, proxies=proxies)

        if response.status_code == 200 and len(response.text) > 10:
            jwt_start = response.text.find("eyJ")
            if jwt_start != -1:
                jwt_token = response.text[jwt_start:]
                second_dot = jwt_token.find(".", jwt_token.find(".") + 1)
                if second_dot != -1:
                    jwt_token = jwt_token[:second_dot + 44]
                    account_id = decode_jwt_token(jwt_token)
                    return {"account_id": account_id, "jwt_token": jwt_token}

        return {"account_id": "N/A", "jwt_token": ""}
    except Exception:
        return {"account_id": "N/A", "jwt_token": ""}

# ===============================
# IMPROVED GENERATION WITH GUARANTEED ACCOUNT COUNT
# ===============================


async def start_account_generation(update: Update, region, account_name, password_prefix, total_accounts, is_ghost):
    """ULTRA TURBO generation with GUARANTEED account count"""
    user_id = update.effective_user.id
    current_generation[user_id] = True

    start_message = f"""
🚀 ULTRA TURBO MODE ACTIVATED!

🎯 Target: {total_accounts} accounts
👤 Name: {account_name}
🔑 Password: {password_prefix}
{'👻 Mode: Ghost Mode' if is_ghost else f'📍 Region: {region}'}
🔄 Proxy Mode: {'✅ ENABLED' if USE_PROXIES else '❌ DISABLED'}
⚡ Speed: MAXIMUM TURBO (8+ acc/sec)
🕒 Started: {datetime.now().strftime('%H:%M:%S')}

🔥 GENERATING {total_accounts} ACCOUNTS GUARANTEED...
    """
    status_msg = await update.message.reply_text(start_message, parse_mode='HTML')

    success_count = 0
    failed_count = 0
    start_time = time.time()

    # KEEP EXECUTOR ALIVE FOR MAX SPEED (Crucial for 8+ acc/sec)
    loop = asyncio.get_event_loop()
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # GUARANTEE ALL ACCOUNTS - KEEP GENERATING UNTIL WE GET EXACT COUNT
        while success_count < total_accounts and current_generation.get(user_id, True):
            remaining = total_accounts - success_count
            # Always fill the queue with at least BATCH_SIZE or remaining
            # Overfill slightly to compensate for fails
            batch_size = min(remaining + 20, BATCH_SIZE)

            futures_dict = {}

            for i in range(batch_size):
                future = executor.submit(
                    ultra_turbo_create_acc,
                    region, account_name, password_prefix, is_ghost
                )
                futures_dict[future] = i

            # Process futures as they complete using non-blocking approach
            pending = set(futures_dict.keys())

            while pending and success_count < total_accounts and current_generation.get(user_id, True):
                done, pending = concurrent.futures.wait(
                    pending, timeout=0.1, return_when=concurrent.futures.FIRST_COMPLETED)

                for future in done:
                    try:
                        account_data = future.result(timeout=1)

                        if account_data:
                            success_count += 1
                            rarity_score = calculate_rarity_score(
                                account_data.get("account_id", "N/A"))

                            # Save account to files
                            save_account_to_files(
                                account_data, region, is_ghost)

                            # Update status frequently to show progress (every 3 accounts)
                            if success_count % 3 == 0 or success_count == total_accounts:
                                elapsed = time.time() - start_time
                                speed = success_count / elapsed if elapsed > 0 else 0

                                # Create progress message with rare folder buttons
                                progress_text = f"🔥 ULTRA TURBO PROGRESS\n\n✅ Generated: {success_count}/{total_accounts}\n❌ Failed: {failed_count}\n⚡ Speed: {speed:.1f} accounts/sec\n🎯 Remaining: {total_accounts - success_count}\n🕒 Time: {datetime.now().strftime('%H:%M:%S')}"

                                # Get rare account counts
                                rare_counts = get_rare_accounts_count()

                                # Create inline buttons for rare account folders with counts
                                keyboard = [
                                    [InlineKeyboardButton(f"⭐ RARE_3 - {rare_counts.get(3, 0)}", callback_data="view_rare_3"),
                                     InlineKeyboardButton(
                                         f"⭐ RARE_4 - {rare_counts.get(4, 0)}", callback_data="view_rare_4"),
                                     InlineKeyboardButton(f"⭐ RARE_5 - {rare_counts.get(5, 0)}", callback_data="view_rare_5")],
                                    [InlineKeyboardButton(f"⭐ RARE_6 - {rare_counts.get(6, 0)}", callback_data="view_rare_6"),
                                     InlineKeyboardButton(
                                         f"⭐ RARE_7 - {rare_counts.get(7, 0)}", callback_data="view_rare_7"),
                                     InlineKeyboardButton(f"⭐ RARE_8 - {rare_counts.get(8, 0)}", callback_data="view_rare_8")]
                                ]
                                reply_markup = InlineKeyboardMarkup(keyboard)

                                try:
                                    # Retry logic for message edit
                                    retry_count = 0
                                    max_retries = 3
                                    while retry_count < max_retries:
                                        try:
                                            await status_msg.edit_text(
                                                progress_text,
                                                parse_mode='HTML',
                                                reply_markup=reply_markup
                                            )
                                            print(
                                                f"[PROGRESS] {success_count}/{total_accounts} | Failed: {failed_count} | Speed: {speed:.1f} acc/sec")
                                            break
                                        except Exception as edit_err:
                                            retry_count += 1
                                            if retry_count < max_retries:
                                                # Wait before retry
                                                await asyncio.sleep(0.5)
                                            else:
                                                raise edit_err
                                except Exception as e:
                                    print(
                                        f"[ERROR] Failed to update progress message: {str(e)[:100]}")
                                    # Try to send a new message if edit fails
                                    try:
                                        status_msg = await update.message.reply_text(
                                            progress_text,
                                            parse_mode='HTML',
                                            reply_markup=reply_markup
                                        )
                                    except Exception as e2:
                                        print(
                                            f"[ERROR] Failed to send new progress message: {str(e2)[:100]}")
                        else:
                            failed_count += 1

                    except Exception as e:
                        failed_count += 1
                        print(f"[ERROR] Account generation failed: {e}")
                        continue

                # Allow event loop to process other tasks (Telegram messages)
                await asyncio.sleep(0.01)

    # CALCULATE FINAL STATISTICS
    end_time = time.time()
    total_time = end_time - start_time
    speed = success_count / total_time if total_time > 0 else 0

    # CREATE SUMMARY FILES
    all_accounts_path, rare_uids_path, total_saved, rare_count = create_summary_files(
        region, is_ghost)

    completion_message = f"""
🎉 MISSION ACCOMPLISHED!

✅ Generated: {success_count}/{total_accounts} accounts
❌ Failed: {failed_count} attempts
💾 Saved to Database: {total_saved} accounts
🌟 Rare Accounts Found: {rare_count}
⏱️ Total Time: {total_time:.1f}s
⚡ Average Speed: {speed:.1f} accounts/sec
📈 Success Rate: {((success_count/(success_count + failed_count))*100) if failed_count > 0 else 100.0:.1f}%
🕒 Finished: {datetime.now().strftime('%H:%M:%S')}
    """

    # Create buttons for viewing accounts and rare folders
    rare_counts = get_rare_accounts_count()

    keyboard = [
        [InlineKeyboardButton("📥 View All Accounts (ZIP)",
                              callback_data=f"download_accounts_{region}_{int(is_ghost)}")],
        [InlineKeyboardButton(f"⭐ RARE_3 - {rare_counts.get(3, 0)}", callback_data="view_rare_3"),
         InlineKeyboardButton(
             f"⭐ RARE_4 - {rare_counts.get(4, 0)}", callback_data="view_rare_4"),
         InlineKeyboardButton(f"⭐ RARE_5 - {rare_counts.get(5, 0)}", callback_data="view_rare_5")],
        [InlineKeyboardButton(f"⭐ RARE_6 - {rare_counts.get(6, 0)}", callback_data="view_rare_6"),
         InlineKeyboardButton(
             f"⭐ RARE_7 - {rare_counts.get(7, 0)}", callback_data="view_rare_7"),
         InlineKeyboardButton(f"⭐ RARE_8 - {rare_counts.get(8, 0)}", callback_data="view_rare_8")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(completion_message, parse_mode='HTML', reply_markup=reply_markup)

    # CLEANUP
    if user_id in user_sessions:
        user_sessions[user_id]['generating'] = False
    if user_id in current_generation:
        del current_generation[user_id]

# ===============================
# ALL ORIGINAL FUNCTIONS PRESERVED EXACTLY
# ===============================


def verify_proxy(proxy_url):
    """Test if a proxy is working"""
    try:
        proxies = {
            "http": proxy_url,
            "https": proxy_url
        }
        response = TURBO_SESSION.get(
            "https://httpbin.org/ip", proxies=proxies, timeout=5)
        if response.status_code == 200:
            print(f"{get_random_color()}✅ Proxy working: {proxy_url}{Colors.RESET}")
            return True
    except Exception:
        return False
    return False


def verify_all_proxies():
    """Verify all proxies and keep only working ones"""
    global WORKING_PROXIES, PROXY_VERIFIED, FAILED_PROXIES

    if PROXY_VERIFIED and WORKING_PROXIES:
        return WORKING_PROXIES

    print(f"{get_random_color()}{Colors.BRIGHT}🔄 Verifying proxies...{Colors.RESET}")

    WORKING_PROXIES = []
    FAILED_PROXIES.clear()

    def verify_single_proxy(proxy):
        if verify_proxy(proxy):
            WORKING_PROXIES.append(proxy)
        else:
            FAILED_PROXIES.add(proxy)

    threads = []
    for proxy in PROXY_LIST:
        if proxy not in FAILED_PROXIES:
            thread = threading.Thread(
                target=verify_single_proxy, args=(proxy,))
            threads.append(thread)
            thread.start()

    for thread in threads:
        thread.join()

    PROXY_VERIFIED = True
    print(f"{get_random_color()}{Colors.BRIGHT}✅ Proxy verification complete: {len(WORKING_PROXIES)}/{len(PROXY_LIST)} working{Colors.RESET}")

    if FAILED_PROXIES:
        print(f"{Fore.YELLOW}❌ Failed proxies: {len(FAILED_PROXIES)}{Colors.RESET}")

    if not WORKING_PROXIES:
        print(f"{Fore.YELLOW}{Colors.BRIGHT}⚠️ No working proxies found. Using direct connection.{Colors.RESET}")

    return WORKING_PROXIES


def get_next_proxy():
    """Get next working proxy from the list in round-robin fashion"""
    global CURRENT_PROXY_INDEX, WORKING_PROXIES

    if not PROXY_VERIFIED or not WORKING_PROXIES:
        WORKING_PROXIES = verify_all_proxies()

    with PROXY_LOCK:
        if not WORKING_PROXIES:
            return None

        proxy = WORKING_PROXIES[CURRENT_PROXY_INDEX]
        CURRENT_PROXY_INDEX = (CURRENT_PROXY_INDEX + 1) % len(WORKING_PROXIES)

        return {"http": proxy, "https": proxy}


def mark_proxy_failed(proxy_url):
    """Mark a proxy as failed and remove it from working list"""
    global WORKING_PROXIES, FAILED_PROXIES

    with PROXY_LOCK:
        if proxy_url in WORKING_PROXIES:
            WORKING_PROXIES.remove(proxy_url)
            FAILED_PROXIES.add(proxy_url)
            print(f"{Fore.RED}❌ Removed failed proxy: {proxy_url}{Colors.RESET}")
            print(
                f"{get_random_color()}📊 Remaining working proxies: {len(WORKING_PROXIES)}{Colors.RESET}")

            global CURRENT_PROXY_INDEX
            if CURRENT_PROXY_INDEX >= len(WORKING_PROXIES):
                CURRENT_PROXY_INDEX = 0


def install_requirements():
    """Check and install required packages automatically"""
    required_packages = [
        'requests',
        'pycryptodome',
        'colorama',
        'urllib3',
        'psutil',
        'python-telegram-bot'
    ]

    print(f"{get_random_color()}{Colors.BRIGHT}📦 Checking required packages...{Colors.RESET}")

    for package in required_packages:
        try:
            if package == 'pycryptodome':
                import Crypto
            else:
                importlib.import_module(package)
            print(f"{get_random_color()}✅ {package} is installed{Colors.RESET}")
        except ImportError:
            print(f"{get_random_color()}📥 Installing {package}...{Colors.RESET}")
            try:
                subprocess.check_call(
                    [sys.executable, '-m', 'pip', 'install', package])
                print(
                    f"{get_random_color()}✅ {package} installed successfully{Colors.RESET}")
            except subprocess.CalledProcessError:
                print(f"{Fore.RED}❌ Failed to install {package}{Colors.RESET}")
                return False
    return True


def get_region(language_code: str) -> str:
    return REGION_LANG.get(language_code)


def get_region_url(region_code: str) -> str:
    """Return URL for a given region code"""
    return REGION_URLS.get(region_code, "https://clientbp.ggblueshark.com/")


def safe_exit(signum=None, frame=None):
    global EXIT_FLAG
    EXIT_FLAG = True
    color = get_random_color()
    print(
        f"\n{color}{Colors.BRIGHT}🛑 Safe exit triggered. Closing script...{Colors.RESET}")
    sys.exit(0)


signal.signal(signal.SIGINT, safe_exit)
signal.signal(signal.SIGTERM, safe_exit)


def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')


def display_banner():
    color = get_random_color()
    banner = f"""
{color}{Colors.BRIGHT}

╔══════════════════════════════════════════════════════════════╗
║ 🚀 BANECIPHERXR ULTRA TURBO GENERATOR                       ║
║ ⚡ MAXIMUM SPEED - GUARANTEED ACCOUNT COUNT                 ║
║ 🎯 TARGET: 15+ ACCOUNTS PER SECOND                         ║
║ 💎 By BANECIPHERXR | Not For Sale !                        ║
╚══════════════════════════════════════════════════════════════╝
{Colors.RESET}
"""
    print(banner)


def print_success(message):
    color = get_random_color()
    print(f"{color}{Colors.BRIGHT}✅ SUCCESS: {message}{Colors.RESET}")


def print_error(message):
    print(f"{Fore.RED}{Colors.BRIGHT}❌ ERROR: {message}{Colors.RESET}")


def print_warning(message):
    print(f"{Fore.YELLOW}{Colors.BRIGHT}⚠️ WARNING: {message}{Colors.RESET}")


def print_rare(message):
    print(f"{Fore.LIGHTMAGENTA_EX}{Colors.BRIGHT}🌟 RARE: {message}{Colors.RESET}")


def print_registration_status(count, total, name, uid, password, account_id, rarity_score, region, is_ghost=False):
    rarity_color = get_rarity_color(rarity_score)
    rarity_label = get_rarity_label(rarity_score)
    print(f"{get_random_color()}{Colors.BRIGHT}📊 Registration {count}/{total}{Colors.RESET}")
    print(f"{get_random_color()}👤 Name: {get_random_color()}{name}{Colors.RESET}")
    print(f"{get_random_color()}🆔 UID: {get_random_color()}{uid}{Colors.RESET}")
    print(
        f"{get_random_color()}🎯 Account ID: {rarity_color}{account_id} [{rarity_label}]{Colors.RESET}")
    print(f"{get_random_color()}🔑 Password: {get_random_color()}{password}{Colors.RESET}")
    if is_ghost:
        print(
            f"{get_random_color()}👻 Mode: {Fore.LIGHTMAGENTA_EX}GHOST Mode{Colors.RESET}")
    else:
        print(
            f"{get_random_color()}📍 Region: {get_random_color()}{region}{Colors.RESET}")
    print(f"{get_random_color()}⭐ Rarity Score: {rarity_color}{rarity_score}{Colors.RESET}")
    print()


def calculate_rarity_score(account_id):
    if not account_id or account_id == "N/A":
        return 0
    account_str = str(account_id)
    score = 0
    patterns = [
        (r'(\d)\1{3,}', 3),
        (r'(\d)\1{2,}', 2),
        (r'0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210', 2),
        (r'^[1-9]000$|^9999$|^8888$|^7777$|^6666$|^5555$|^4444$|^3333$|^2222$|^1111$', 3),
        (r'888$|999$|777$|666$', 1),
        (r'^88|^99|^66|^77', 1),
        (r'1314|520|521|3344|2013|2014', 1)
    ]
    for pattern, points in patterns:
        if re.search(pattern, account_str):
            score += points
    if account_str == account_str[::-1] and len(account_str) >= 4:
        score += 3
    if len(account_str) < 8:
        score += 2
    return score


def get_rarity_color(score):
    if score >= 8:
        return Fore.LIGHTMAGENTA_EX
    elif score >= 5:
        return Fore.LIGHTRED_EX
    elif score >= 3:
        return Fore.LIGHTYELLOW_EX
    elif score >= 1:
        return Fore.LIGHTGREEN_EX
    else:
        return Fore.LIGHTWHITE_EX


def get_rarity_label(score):
    if score >= 8:
        return "🌟 ULTRA RARE"
    elif score >= 5:
        return "⭐ VERY RARE"
    elif score >= 3:
        return "✨ RARE"
    elif score >= 1:
        return "🔶 UNCOMMON"
    else:
        return "🔷 COMMON"


def get_rare_accounts_count(rarity_score=None):
    """Get count of accounts in each rare folder (3-8)"""
    counts = {}
    for score in range(3, 9):
        folder_path = os.path.join(RARE_ACCOUNTS_FOLDER, str(score))
        try:
            if os.path.exists(folder_path):
                files = [f for f in os.listdir(
                    folder_path) if f.endswith('.json')]
                count = 0
                for file in files:
                    try:
                        with open(os.path.join(folder_path, file), 'r', encoding='utf-8') as f:
                            data = json.load(f)
                            if isinstance(data, list):
                                count += len(data)
                            else:
                                count += 1
                    except:
                        pass
                counts[score] = count
            else:
                counts[score] = 0
        except:
            counts[score] = 0
    return counts


def generate_exponent_number():
    exponent_digits = {'0': '0', '1': '1', '2': '2', '3': '3',
                       '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9'}
    number = random.randint(1, 99999)
    number_str = f"{number:05d}"
    exponent_str = ''.join(exponent_digits[digit] for digit in number_str)
    return exponent_str


def generate_random_name(base_name):
    exponent_part = generate_exponent_number()
    return f"{base_name[:7]}{exponent_part}"


def generate_custom_password(prefix):
    characters = string.ascii_uppercase + string.digits
    random_part = ''.join(random.choice(characters) for _ in range(11))
    return f"{prefix}_{random_part}"

# PROTOBUF FUNCTIONS


def EnC_Vr(N):
    if N < 0:
        return b''
    H = []
    while True:
        BesTo = N & 0x7F
        N >>= 7
        if N:
            BesTo |= 0x80
        H.append(BesTo)
        if not N:
            break
    return bytes(H)


def CrEaTe_VarianT(field_number, value):
    field_header = (field_number << 3) | 0
    return EnC_Vr(field_header) + EnC_Vr(value)


def CrEaTe_LenGTh(field_number, value):
    field_header = (field_number << 3) | 2
    encoded_value = value.encode() if isinstance(value, str) else value
    return EnC_Vr(field_header) + EnC_Vr(len(encoded_value)) + encoded_value


def CrEaTe_ProTo(fields):
    packet = bytearray()
    for field, value in fields.items():
        if isinstance(value, dict):
            nested_packet = CrEaTe_ProTo(value)
            packet.extend(CrEaTe_LenGTh(field, nested_packet))
        elif isinstance(value, int):
            packet.extend(CrEaTe_VarianT(field, value))
        elif isinstance(value, str) or isinstance(value, bytes):
            packet.extend(CrEaTe_LenGTh(field, value))
    return packet


def E_AEs(Pc):
    Z = bytes.fromhex(Pc)
    key = bytes([89, 103, 38, 116, 99, 37, 68, 69,
                117, 104, 54, 37, 90, 99, 94, 56])
    iv = bytes([54, 111, 121, 90, 68, 114, 50, 50,
               69, 51, 121, 99, 104, 106, 77, 37])
    K = AES.new(key, AES.MODE_CBC, iv)
    R = K.encrypt(pad(Z, AES.block_size))
    return R


def encrypt_api(plain_text):
    plain_text = bytes.fromhex(plain_text)
    key = bytes([89, 103, 38, 116, 99, 37, 68, 69,
                117, 104, 54, 37, 90, 99, 94, 56])
    iv = bytes([54, 111, 121, 90, 68, 114, 50, 50,
               69, 51, 121, 99, 104, 106, 77, 37])
    cipher = AES.new(key, AES.MODE_CBC, iv)
    cipher_text = cipher.encrypt(pad(plain_text, AES.block_size))
    return cipher_text.hex()


def save_rare_account(account_data, token_data, region, is_ghost=False):
    try:
        rarity_score = calculate_rarity_score(account_data.get("account_id"))

        if is_ghost:
            score_folder = os.path.join(GHOST_RARE_FOLDER, str(rarity_score))
            os.makedirs(score_folder, exist_ok=True)
            rare_filename = os.path.join(
                score_folder, f"ghost_{rarity_score}.json")
        else:
            score_folder = os.path.join(
                RARE_ACCOUNTS_FOLDER, str(rarity_score))
            os.makedirs(score_folder, exist_ok=True)
            rare_filename = os.path.join(
                score_folder, f"{region}_{rarity_score}.json")

        rare_account = {
            'account_uid': account_data.get("account_id", "N/A"),
            'uid': account_data["uid"],
            'password': account_data["password"],
            'nickname': account_data["name"],
            'token': token_data.get("token", ""),
            'date_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'region': "BANECIPHERXR" if is_ghost else region,
            'rarity_score': rarity_score
        }

        rare_list = []
        if os.path.exists(rare_filename):
            with open(rare_filename, 'r', encoding='utf-8') as f:
                try:
                    rare_list = json.load(f)
                except json.JSONDecodeError:
                    rare_list = []

        rare_list = [acc for acc in rare_list if acc.get(
            'uid') != account_data["uid"]]
        rare_list.append(rare_account)

        with open(rare_filename, 'w', encoding='utf-8') as f:
            json.dump(rare_list, f, indent=2, ensure_ascii=False)

        return True
    except Exception as e:
        print_error(f"Error saving rare account: {e}")
        return False


def save_jwt_token(account_data, jwt_token, region, is_ghost=False):
    try:
        if is_ghost:
            token_filename = os.path.join(GHOST_FOLDER, "tokens-ghost.json")
        else:
            token_filename = os.path.join(
                TOKENS_FOLDER, f"tokens-{region}.json")

        token_entry = {
            'uid': account_data["uid"],
            'account_id': account_data.get("account_id", "N/A"),
            'jwt_token': jwt_token,
            'name': account_data["name"],
            'password': account_data["password"],
            'date_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'region': "BANECIPHERXR" if is_ghost else region
        }

        tokens_list = []
        if os.path.exists(token_filename):
            with open(token_filename, 'r', encoding='utf-8') as f:
                try:
                    tokens_list = json.load(f)
                except json.JSONDecodeError:
                    tokens_list = []

        tokens_list = [token for token in tokens_list if token.get(
            'uid') != account_data["uid"]]
        tokens_list.append(token_entry)

        with open(token_filename, 'w', encoding='utf-8') as f:
            json.dump(tokens_list, f, indent=2, ensure_ascii=False)

        return True
    except Exception as e:
        print_error(f"Error saving JWT token: {e}")
        return False


def save_normal_account(account_data, region, is_ghost=False):
    try:
        if is_ghost:
            account_filename = os.path.join(
                GHOST_ACCOUNTS_FOLDER, "ghost.json")
        else:
            account_filename = os.path.join(
                ACCOUNTS_FOLDER, f"accounts-{region}.json")

        account_entry = {
            'uid': account_data["uid"],
            'password': account_data["password"],
            'account_id': account_data.get("account_id", "N/A"),
            'name': account_data["name"],
            'region': "BANECIPHERXR" if is_ghost else region,
            'date_created': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'rarity_score': calculate_rarity_score(account_data.get("account_id"))
        }

        accounts_list = []
        if os.path.exists(account_filename):
            with open(account_filename, 'r', encoding='utf-8') as f:
                try:
                    accounts_list = json.load(f)
                except json.JSONDecodeError:
                    accounts_list = []

        accounts_list = [acc for acc in accounts_list if acc.get(
            'uid') != account_data["uid"]]
        accounts_list.append(account_entry)

        with open(account_filename, 'w', encoding='utf-8') as f:
            json.dump(accounts_list, f, indent=2, ensure_ascii=False)

        return True
    except Exception as e:
        print_error(f"Error saving normal account: {e}")
        return False


def encode_string(original):
    keystream = [0x30, 0x30, 0x30, 0x32, 0x30, 0x31, 0x37, 0x30, 0x30, 0x30, 0x30, 0x30, 0x32, 0x30, 0x31, 0x37,
                 0x30, 0x30, 0x30, 0x30, 0x30, 0x32, 0x30, 0x31, 0x37, 0x30, 0x30, 0x30, 0x30, 0x30, 0x32, 0x30]
    encoded = ""
    for i in range(len(original)):
        orig_byte = ord(original[i])
        key_byte = keystream[i % len(keystream)]
        result_byte = orig_byte ^ key_byte
        encoded += chr(result_byte)
    return {"open_id": original, "field_14": encoded}


def to_unicode_escaped(s):
    return ''.join(c if 32 <= ord(c) <= 126 else f'\\u{ord(c):04x}' for c in s)


def decode_jwt_token(jwt_token):
    """Decode JWT token to get account_id"""
    try:
        parts = jwt_token.split('.')
        if len(parts) >= 2:
            payload_part = parts[1]
            padding = 4 - len(payload_part) % 4
            if padding != 4:
                payload_part += '=' * padding
            decoded = base64.urlsafe_b64decode(payload_part)
            data = json.loads(decoded)
            account_id = data.get('account_id') or data.get('external_id')
            if account_id:
                return str(account_id)
    except Exception as e:
        print_warning(f"JWT decode failed: {e}")
    return "N/A"


def save_account_to_files(account_data, region, is_ghost):
    """Save account to all appropriate files"""
    account_id = account_data.get("account_id", "N/A")
    jwt_token = account_data.get("jwt_token", "")
    rarity_score = calculate_rarity_score(account_id)

    save_normal_account(account_data, region, is_ghost)

    if jwt_token:
        save_jwt_token(account_data, jwt_token, region, is_ghost)

    if rarity_score >= 3:
        save_rare_account(account_data, {"token": jwt_token}, region, is_ghost)


def get_user_statistics(user_id):
    """Get user statistics"""
    return {
        'total_accounts': 0,
        'rare_accounts': 0,
        'regions_used': 0,
        'ghost_accounts': 0
    }

# ===============================
# ALL ORIGINAL TELEGRAM FUNCTIONS PRESERVED
# ===============================


async def send_individual_account(update: Update, account_data, rarity_score, region, is_ghost=False):
    """Send individual account details to user"""
    try:
        rarity_label = get_rarity_label(rarity_score)

        if is_ghost:
            mode_text = "👻 GHOST MODE"
        else:
            mode_text = f"📍 Region: {region}"

        message = f"""
🎮 FREE FIRE ACCOUNT GENERATED

{mode_text}
👤 Name: <code>{account_data['name']}</code>
🆔 UID: <code>{account_data['uid']}</code>
🔑 Password: <code>{account_data['password']}</code>
🎯 Account ID: <code>{account_data.get('account_id', 'N/A')}</code>
⭐ Rarity: {rarity_label} (Score: {rarity_score})
🕒 Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

✅ Account saved to database
        """

        await update.message.reply_text(message, parse_mode='HTML')

        if rarity_score >= 3:
            rare_message = f"🌟 RARE ACCOUNT ALERT!\n⭐ Score: {rarity_score} - {rarity_label}\n🆔 UID: <code>{account_data['uid']}</code>"
            await update.message.reply_text(rare_message, parse_mode='HTML')

    except Exception as e:
        print(f"Failed to send account to Telegram: {e}")


async def send_welcome_message(update: Update):
    welcome_text = f"""
🚀 BANECIPHERXR ULTRA TURBO GENERATOR

⚡ MAXIMUM SPEED ACCOUNT GENERATOR
🎯 Create Unlimited Free Fire Accounts

✨ Features:
• Multiple Regions Supported
• 👻 Ghost Mode Available  
• ⭐ Rare Account Detection
• 🔄 Proxy Rotation System
• ⚡ ULTRA TURBO SPEED (15+ accounts/sec)
• 📱 Individual Account Delivery
• 🎨 Beautiful Interface

📊 Current Status:
• 🎯 Regions: 12 Available
• 👻 Ghost Mode: Enabled
• ⭐ Rarity System: Active
• 🔄 Proxies: {len(WORKING_PROXIES)} Working
• ⚡ Speed: ULTRA TURBO MODE

🚀 Get Started:
Use the buttons below to generate accounts instantly!

💎 By BANECIPHERXR | Not For Sale
    """

    keyboard = [
        [InlineKeyboardButton("🚀 Generate Accounts",
                              callback_data="main_generate")],
        [InlineKeyboardButton(
            "📍 Select Region", callback_data="select_region")],
        [InlineKeyboardButton("👻 Ghost Mode", callback_data="ghost_mode")],
        [InlineKeyboardButton("🔄 Proxy Mode", callback_data="proxy_mode")],
        [InlineKeyboardButton("📊 View Statistics",
                              callback_data="view_stats")],
        [InlineKeyboardButton("❓ Help", callback_data="help")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(welcome_text, reply_markup=reply_markup, parse_mode='HTML')


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send welcome message when command /start is issued."""
    await send_welcome_message(update)


async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle button callbacks"""
    query = update.callback_query
    await query.answer()

    user_id = query.from_user.id

    if query.data == "main_generate":
        await show_generate_options(query)
    elif query.data == "select_region":
        await show_regions_menu(query)
    elif query.data == "ghost_mode":
        await start_ghost_generation(query)
    elif query.data == "proxy_mode":
        await show_proxy_mode_menu(query)
    elif query.data == "view_stats":
        await show_user_stats(query, user_id)
    elif query.data == "help":
        await show_help_menu(query)
    elif query.data.startswith("region_"):
        region = query.data.replace("region_", "")
        await start_region_generation(query, region)
    elif query.data == "proxy_with":
        await set_proxy_mode(query, True)
    elif query.data == "proxy_without":
        await set_proxy_mode(query, False)
    elif query.data == "proxy_status":
        await show_proxy_status(query)
    elif query.data == "proxy_verify":
        await verify_proxies_action(query)
    elif query.data == "back_to_main":
        await send_welcome_callback(query)
    elif query.data == "stop_generation":
        await stop_generation(query, user_id)
    elif query.data.startswith("download_accounts_"):
        parts = query.data.split("_")
        region = parts[2]
        is_ghost = bool(int(parts[3]))
        await send_accounts_zip(query, region, is_ghost)


async def show_generate_options(query):
    """Show account generation options"""
    keyboard = [
        [InlineKeyboardButton("📍 Region Accounts",
                              callback_data="select_region")],
        [InlineKeyboardButton("👻 Ghost Mode", callback_data="ghost_mode")],
        [InlineKeyboardButton("🔄 Proxy Mode", callback_data="proxy_mode")],
        [InlineKeyboardButton("🔙 Back", callback_data="back_to_main")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await query.edit_message_text(
        f"🎮 Account Generation\n\nChoose generation mode:\n\n⚡ Current Speed: 15+ accounts/sec\n🔄 Proxy Mode: {'✅ ENABLED' if USE_PROXIES else '❌ DISABLED'}",
        reply_markup=reply_markup,
        parse_mode='HTML'
    )


async def show_proxy_mode_menu(query):
    """Show proxy mode selection"""
    keyboard = [
        [InlineKeyboardButton("✅ WITH PROXIES", callback_data="proxy_with")],
        [InlineKeyboardButton("❌ WITHOUT PROXIES",
                              callback_data="proxy_without")],
        [InlineKeyboardButton("📊 Proxy Status", callback_data="proxy_status")],
        [InlineKeyboardButton("🔄 Verify Proxies",
                              callback_data="proxy_verify")],
        [InlineKeyboardButton("🔙 Back", callback_data="main_generate")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await query.edit_message_text(
        f"🔄 Proxy Mode Selection\n\n⚡ Current Mode: {'✅ WITH PROXIES' if USE_PROXIES else '❌ WITHOUT PROXIES'}\n📊 Working Proxies: {len(WORKING_PROXIES)}\n⚡ Speed: 15+ accounts/sec\n\nChoose your generation mode:",
        reply_markup=reply_markup,
        parse_mode='HTML'
    )


async def set_proxy_mode(query, use_proxies):
    """Set proxy mode"""
    global USE_PROXIES
    USE_PROXIES = use_proxies

    if use_proxies:
        mode_text = "✅ PROXY MODE ENABLED"
        details = f"Using {len(WORKING_PROXIES)} working proxies\nEnhanced anonymity & rotation\n⚡ Speed: 15+ accounts/sec"
    else:
        mode_text = "⚡ DIRECT MODE ENABLED"
        details = "Maximum speed\nDirect connections\n⚡ Speed: 15+ accounts/sec"

    await query.edit_message_text(
        f"{mode_text}\n\n{details}\n\nYour generation mode has been updated!",
        parse_mode='HTML'
    )


async def show_regions_menu(query):
    """Show available regions"""
    keyboard = []
    regions = list(REGION_LANG.keys())

    for i in range(0, len(regions), 2):
        row = []
        if i < len(regions):
            row.append(InlineKeyboardButton(
                f"📍 {regions[i]}", callback_data=f"region_{regions[i]}"))
        if i + 1 < len(regions):
            row.append(InlineKeyboardButton(
                f"📍 {regions[i+1]}", callback_data=f"region_{regions[i+1]}"))
        keyboard.append(row)

    keyboard.append([InlineKeyboardButton(
        "🔙 Back", callback_data="main_generate")])

    reply_markup = InlineKeyboardMarkup(keyboard)

    await query.edit_message_text(
        "🌍 Select Region\n\nChoose your preferred Free Fire region:",
        reply_markup=reply_markup,
        parse_mode='HTML'
    )


async def start_region_generation(query, region):
    """Start region-based account generation"""
    user_id = query.from_user.id
    user_sessions[user_id] = {
        'region': region,
        'is_ghost': False,
        'generating': True
    }

    mode_text = "✅ WITH PROXIES" if USE_PROXIES else "❌ WITHOUT PROXIES"

    await query.edit_message_text(
        f"🚀 Starting {region} Account Generation\n\n⚡ Mode: {mode_text}\n🎯 Speed: 15+ accounts/sec\n\nPlease send me the following information:\n\n1. Number of accounts (e.g., 10)\n2. Account name prefix (max 7 chars, e.g., PLAYER)\n3. Password prefix (e.g., FFACC)\n\n📝 Send in this format:\n<code>10 PLAYER FFACC</code>",
        parse_mode='HTML'
    )


async def start_ghost_generation(query):
    """Start ghost mode account generation"""
    user_id = query.from_user.id
    user_sessions[user_id] = {
        'region': 'BR',
        'is_ghost': True,
        'generating': True
    }

    mode_text = "✅ WITH PROXIES" if USE_PROXIES else "❌ WITHOUT PROXIES"

    await query.edit_message_text(
        f"👻 Starting Ghost Mode Generation\n\n⚡ Mode: {mode_text}\n🎯 Speed: 15+ accounts/sec\n\nPlease send me the following information:\n\n1. Number of accounts (e.g., 10)\n2. Account name prefix (max 7 chars, e.g., GHOST)\n3. Password prefix (e.g., GHOSTFF)\n\n📝 Send in this format:\n<code>10 GHOST GHOSTFF</code>",
        parse_mode='HTML'
    )


async def show_proxy_status(query):
    """Show detailed proxy status"""
    working_count = len(WORKING_PROXIES)
    failed_count = len(FAILED_PROXIES)
    total_count = len(PROXY_LIST)

    status_text = f"📊 Proxy Status Details\n\n"
    status_text += f"⚡ Current Mode: {'✅ ENABLED' if USE_PROXIES else '❌ DISABLED'}\n"
    status_text += f"✅ Working Proxies: {working_count}/{total_count}\n"
    status_text += f"❌ Failed Proxies: {failed_count}\n"
    status_text += f"📈 Success Rate: {(working_count/total_count)*100:.1f}%\n"
    status_text += f"🎯 Speed: 15+ accounts/sec\n\n"

    if WORKING_PROXIES:
        status_text += "🔝 Top Active Proxies:\n"
        for i, proxy in enumerate(WORKING_PROXIES[:8], 1):
            status_text += f"{i}. {proxy}\n"
        if len(WORKING_PROXIES) > 8:
            status_text += f"... and {len(WORKING_PROXIES) - 8} more\n"

    keyboard = [
        [InlineKeyboardButton("🔄 Verify Again", callback_data="proxy_verify")],
        [InlineKeyboardButton("🔙 Back", callback_data="proxy_mode")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await query.edit_message_text(status_text, reply_markup=reply_markup, parse_mode='HTML')


async def verify_proxies_action(query):
    """Verify all proxies"""
    await query.edit_message_text("🔄 Verifying Proxies...\n\nThis may take a few seconds...", parse_mode='HTML')

    def verify_proxies():
        return verify_all_proxies()

    loop = asyncio.get_event_loop()
    working_proxies = await loop.run_in_executor(None, verify_proxies)

    working_count = len(working_proxies)
    total_count = len(PROXY_LIST)

    await query.edit_message_text(
        f"✅ Proxy Verification Complete\n\n✅ Working Proxies: {working_count}/{total_count}\n📈 Success Rate: {(working_count/total_count)*100:.1f}%\n⚡ Speed: ULTRA TURBO MODE READY\n🎯 Target: 15+ accounts/sec",
        parse_mode='HTML'
    )


async def show_user_stats(query, user_id):
    """Show user statistics"""
    stats = get_user_statistics(user_id)

    keyboard = [
        [InlineKeyboardButton("🔙 Back", callback_data="back_to_main")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await query.edit_message_text(
        f"📊 Your Statistics\n\n👤 User ID: <code>{user_id}</code>\n📊 Total Accounts: {stats['total_accounts']}\n🌟 Rare Accounts: {stats['rare_accounts']}\n🌍 Regions Used: {stats['regions_used']}\n👻 Ghost Mode: {stats['ghost_accounts']}\n🔄 Proxy Mode: {'✅ ENABLED' if USE_PROXIES else '❌ DISABLED'}\n⚡ Speed: 15+ accounts/sec",
        reply_markup=reply_markup,
        parse_mode='HTML'
    )


async def show_help_menu(query):
    """Show help menu"""
    help_text = """
❓ Help & Guide

🎯 How to Use:
1. Choose generation mode (Region/Ghost)
2. Select proxy mode (With/Without)
3. Send format: <code>Number NamePrefix PasswordPrefix</code>
4. Wait for accounts to be generated (15+/sec)
5. Receive each account individually

🌍 Available Regions:
• IND - India | ID - Indonesia  
• BR - Brazil | ME - Middle East
• VN - Vietnam | TH - Thailand
• CIS - Russia | And more...

👻 Ghost Mode:
• Special generation mode
• Enhanced privacy
• Different server routing

🔄 Proxy Modes:
• WITH PROXIES: Enhanced anonymity, proxy rotation
• WITHOUT PROXIES: Maximum speed, direct connection

⭐ Rarity System:
• Score 1-2: Common
• Score 3-4: Uncommon  
• Score 5-7: Rare
• Score 8+: Ultra Rare

⚡ ULTRA TURBO Features:
• 100 concurrent workers
• No delays between requests
• 6 second timeouts
• Guaranteed account count
• 15+ accounts per second

🛠️ Support:
Contact admin for help
    """

    keyboard = [
        [InlineKeyboardButton("🔙 Back", callback_data="back_to_main")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await query.edit_message_text(help_text, reply_markup=reply_markup, parse_mode='HTML')


async def send_welcome_callback(query):
    """Send welcome message for callback"""
    welcome_text = """
🚀 BANECIPHERXR ULTRA TURBO GENERATOR

⚡ MAXIMUM SPEED ACCOUNT GENERATOR
🎯 Create Unlimited Free Fire Accounts

Use the buttons below to get started!
    """

    keyboard = [
        [InlineKeyboardButton("🚀 Generate Accounts",
                              callback_data="main_generate")],
        [InlineKeyboardButton(
            "📍 Select Region", callback_data="select_region")],
        [InlineKeyboardButton("👻 Ghost Mode", callback_data="ghost_mode")],
        [InlineKeyboardButton("🔄 Proxy Mode", callback_data="proxy_mode")],
        [InlineKeyboardButton("📊 View Statistics",
                              callback_data="view_stats")],
        [InlineKeyboardButton("❓ Help", callback_data="help")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await query.edit_message_text(welcome_text, reply_markup=reply_markup, parse_mode='HTML')


async def stop_generation(query, user_id):
    """Stop account generation"""
    if user_id in user_sessions:
        user_sessions[user_id]['generating'] = False
        if user_id in current_generation:
            current_generation[user_id] = False

    await query.edit_message_text(
        "🛑 Generation Stopped\n\nAccount generation has been stopped.",
        parse_mode='HTML'
    )


async def handle_generation_params(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle generation parameters from user"""
    user_id = update.effective_user.id
    message_text = update.message.text

    if user_id not in user_sessions or not user_sessions[user_id].get('generating', False):
        return

    try:
        parts = message_text.split()
        if len(parts) < 3:
            await update.message.reply_text(
                "❌ Invalid Format\n\nPlease use: <code>Number NamePrefix PasswordPrefix</code>\nExample: <code>10 PLAYER FFACC</code>",
                parse_mode='HTML'
            )
            return

        total_accounts = int(parts[0])
        account_name = parts[1][:7]
        password_prefix = parts[2]

        if total_accounts > 50000000000:
            await update.message.reply_text("❌ Maximum 500 accounts at once!")
            return

        user_data = user_sessions[user_id]
        region = user_data['region']
        is_ghost = user_data['is_ghost']

        await start_account_generation(update, region, account_name, password_prefix, total_accounts, is_ghost)

    except ValueError:
        await update.message.reply_text("❌ Please enter a valid number for account count!")
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")


def create_summary_files(region, is_ghost=False):
    """Create summary files after generation completes"""
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        prefix = "GHOST" if is_ghost else region

        if is_ghost:
            accounts_file = os.path.join(GHOST_ACCOUNTS_FOLDER, "ghost.json")
        else:
            accounts_file = os.path.join(
                ACCOUNTS_FOLDER, f"accounts-{region}.json")

        all_accounts_data = []
        if os.path.exists(accounts_file):
            with open(accounts_file, 'r', encoding='utf-8') as f:
                all_accounts_data = json.load(f)

        all_accounts_text = f"🚀 BANECIPHERXR ULTRA TURBO GENERATION SUMMARY\n"
        all_accounts_text += f"📍 Region: {prefix}\n"
        all_accounts_text += f"🕒 Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        all_accounts_text += f"📊 Total Accounts: {len(all_accounts_data)}\n"
        all_accounts_text += "="*50 + "\n\n"

        for account in all_accounts_data[-100:]:
            all_accounts_text += f"👤 Name: {account.get('name', 'N/A')}\n"
            all_accounts_text += f"🆔 UID: {account.get('uid', 'N/A')}\n"
            all_accounts_text += f"🔑 Password: {account.get('password', 'N/A')}\n"
            all_accounts_text += f"🎯 Account ID: {account.get('account_id', 'N/A')}\n"
            all_accounts_text += f"⭐ Rarity: {account.get('rarity_score', 0)}\n"
            all_accounts_text += "-"*30 + "\n"

        all_accounts_filename = f"{prefix}_ALL_ACCOUNTS_{timestamp}.txt"
        all_accounts_path = os.path.join(BASE_FOLDER, all_accounts_filename)

        with open(all_accounts_path, 'w', encoding='utf-8') as f:
            f.write(all_accounts_text)

        rare_uids_text = f"🌟 BANECIPHERXR RARE ACCOUNTS SUMMARY\n"
        rare_uids_text += f"📍 Region: {prefix}\n"
        rare_uids_text += f"🕒 Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        rare_uids_text += "="*50 + "\n\n"

        rare_count = 0
        for account in all_accounts_data:
            rarity = account.get('rarity_score', 0)
            if rarity >= 3:
                rare_count += 1
                rare_uids_text += f"⭐ Rarity Score: {rarity}\n"
                rare_uids_text += f"🆔 UID: {account.get('uid', 'N/A')}\n"
                rare_uids_text += f"🔑 Password: {account.get('password', 'N/A')}\n"
                rare_uids_text += f"🎯 Account ID: {account.get('account_id', 'N/A')}\n"
                rare_uids_text += f"👤 Name: {account.get('name', 'N/A')}\n"
                rare_uids_text += "-"*30 + "\n"

        rare_uids_text = f"🌟 BANECIPHERXR RARE ACCOUNTS SUMMARY\n" + \
            f"📍 Region: {prefix}\n" + \
            f"🕒 Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n" + \
            f"📊 Total Rare Accounts: {rare_count}\n" + \
            "="*50 + "\n\n" + rare_uids_text.split("="*50 + "\n\n")[1]

        rare_uids_filename = f"{prefix}_RARE_UIDS_{timestamp}.txt"
        rare_uids_path = os.path.join(BASE_FOLDER, rare_uids_filename)

        with open(rare_uids_path, 'w', encoding='utf-8') as f:
            f.write(rare_uids_text)

        return all_accounts_path, rare_uids_path, len(all_accounts_data), rare_count

    except Exception as e:
        print(f"Error creating summary files: {e}")
        return None, None, 0, 0


async def send_summary_files(update: Update, all_accounts_path, rare_uids_path, total_accounts, rare_count, region, is_ghost=False):
    """Send summary files to user"""
    try:
        prefix = "GHOST" if is_ghost else region

        if all_accounts_path and os.path.exists(all_accounts_path):
            with open(all_accounts_path, 'rb') as file:
                await update.message.reply_document(
                    document=file,
                    filename=os.path.basename(all_accounts_path),
                    caption=f"📄 ALL ACCOUNTS SUMMARY\n\n📍 Region: {prefix}\n📊 Total Accounts: {total_accounts}\n🌟 Rare Accounts: {rare_count}\n🕒 Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                    parse_mode='HTML'
                )

        if rare_uids_path and os.path.exists(rare_uids_path):
            with open(rare_uids_path, 'rb') as file:
                await update.message.reply_document(
                    document=file,
                    filename=os.path.basename(rare_uids_path),
                    caption=f"🌟 RARE ACCOUNTS SUMMARY\n\n📍 Region: {prefix}\n🌟 Rare Accounts Found: {rare_count}\n📊 Total Accounts: {total_accounts}\n🕒 Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                    parse_mode='HTML'
                )

        try:
            if all_accounts_path and os.path.exists(all_accounts_path):
                os.remove(all_accounts_path)
            if rare_uids_path and os.path.exists(rare_uids_path):
                os.remove(rare_uids_path)
        except:
            pass

    except Exception as e:
        print(f"Error sending summary files: {e}")
        await update.message.reply_text("❌ Error sending summary files")


async def send_accounts_zip(query, region, is_ghost):
    """Create and send accounts folder as ZIP file"""
    try:
        await query.answer()
        await query.edit_message_text("📦 Creating ZIP file... Please wait...")

        # Determine the accounts folder path
        if is_ghost:
            accounts_folder = os.path.join(GHOST_ACCOUNTS_FOLDER)
            folder_label = "GHOST"
        else:
            accounts_folder = os.path.join(ACCOUNTS_FOLDER)
            folder_label = region

        if not os.path.exists(accounts_folder):
            await query.edit_message_text("❌ No accounts folder found")
            return

        # Create ZIP file
        import shutil
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        zip_filename = f"accounts_{folder_label}_{timestamp}.zip"
        zip_path = os.path.join(CURRENT_DIR, zip_filename)

        # Create zip of the folder
        shutil.make_archive(zip_path.replace(
            '.zip', ''), 'zip', accounts_folder)

        # Send the ZIP file
        if os.path.exists(zip_path):
            file_size = os.path.getsize(zip_path) / (1024 * 1024)  # Size in MB

            with open(zip_path, 'rb') as file:
                await query.message.reply_document(
                    document=file,
                    filename=zip_filename,
                    caption=f"📥 All Accounts ZIP\n\n📍 Folder: {folder_label}\n📦 File Size: {file_size:.2f} MB\n🕒 Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                    parse_mode='HTML'
                )

            # Clean up the ZIP file
            try:
                os.remove(zip_path)
            except:
                pass

            await query.edit_message_text("✅ ZIP file sent successfully!")
        else:
            await query.edit_message_text("❌ Error creating ZIP file")

    except Exception as e:
        print(f"Error in send_accounts_zip: {e}")
        try:
            await query.edit_message_text(f"❌ Error: {str(e)[:100]}")
        except:
            pass

# ===============================
# ALL ORIGINAL FUNCTIONS PRESERVED
# ===============================


def create_acc(region, account_name, password_prefix, is_ghost=False):
    """ORIGINAL account creation function - PRESERVED"""
    if EXIT_FLAG:
        return None
    try:
        password = generate_custom_password(password_prefix)
        data = f"password={password}&client_type=2&source=2&app_id=100067"
        message = data.encode('utf-8')
        signature = hmac.new(key, message, hashlib.sha256).hexdigest()

        url = "https://100067.connect.garena.com/oauth/guest/register"
        headers = {
            "User-Agent": "GarenaMSDK/4.0.19P8(ASUS_Z01QD ;Android 12;en;US;)",
            "Authorization": "Signature " + signature,
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept-Encoding": "gzip",
            "Connection": "Keep-Alive"
        }

        response = requests.post(url, headers=headers,
                                 data=data, timeout=8, verify=False)
        response.raise_for_status()

        if 'uid' in response.json():
            uid = response.json()['uid']
            print_success(f"Guest account created: {uid}")
            smart_delay()
            return token(uid, password, region, account_name, password_prefix, is_ghost)
        return None
    except Exception as e:
        print_warning(f"Create account failed: {e}")
        smart_delay()
        return None


def token(uid, password, region, account_name, password_prefix, is_ghost=False):
    """ORIGINAL token function - PRESERVED"""
    if EXIT_FLAG:
        return None
    try:
        url = "https://100067.connect.garena.com/oauth/guest/token/grant"
        headers = {
            "Accept-Encoding": "gzip",
            "Connection": "Keep-Alive",
            "Content-Type": "application/x-www-form-urlencoded",
            "Host": "100067.connect.garena.com",
            "User-Agent": "GarenaMSDK/4.0.19P8(ASUS_Z01QD ;Android 12;en;US;)",
        }
        body = {
            "uid": uid,
            "password": password,
            "response_type": "token",
            "client_type": "2",
            "client_secret": key,
            "client_id": "100067"
        }

        response = requests.post(url, headers=headers,
                                 data=body, timeout=30, verify=False)
        response.raise_for_status()

        if 'open_id' in response.json():
            open_id = response.json()['open_id']
            access_token = response.json()["access_token"]
            refresh_token = response.json()['refresh_token']

            result = encode_string(open_id)
            field = to_unicode_escaped(result['field_14'])
            field = codecs.decode(field, 'unicode_escape').encode('latin1')
            print_success(f"Token granted for: {uid}")
            smart_delay()
            return Major_Regsiter(access_token, open_id, field, uid, password, region, account_name, password_prefix, is_ghost)
        return None
    except Exception as e:
        print_warning(f"Token grant failed: {e}")
        smart_delay()
        return None


def Major_Regsiter(access_token, open_id, field, uid, password, region, account_name, password_prefix, is_ghost=False):
    """ORIGINAL Major_Regsiter function - PRESERVED"""
    if EXIT_FLAG:
        return None

    proxy = None
    try:
        if is_ghost:
            url = "https://loginbp.ggblueshark.com/MajorRegister"
        else:
            if region.upper() in ["ME", "TH"]:
                url = "https://loginbp.common.ggbluefox.com/MajorRegister"
            else:
                url = "https://loginbp.ggblueshark.com/MajorRegister"

        name = generate_random_name(account_name)

        headers = {
            "Accept-Encoding": "gzip",
            "Authorization": "Bearer",
            "Connection": "Keep-Alive",
            "Content-Type": "application/x-www-form-urlencoded",
            "Expect": "100-continue",
            "Host": "loginbp.ggblueshark.com" if is_ghost or region.upper() not in ["ME", "TH"] else "loginbp.common.ggbluefox.com",
            "ReleaseVersion": "Ob51",
            "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 9; ASUS_I005DA Build/PI)",
            "X-GA": "v1 1",
            "X-Unity-Version": "2018.4."
        }

        lang_code = "pt" if is_ghost else REGION_LANG.get(region.upper(), "en")
        payload = {
            1: name,
            2: access_token,
            3: open_id,
            5: 102000007,
            6: 4,
            7: 1,
            13: 1,
            14: field,
            15: lang_code,
            16: 1,
            17: 1
        }

        payload_bytes = CrEaTe_ProTo(payload)
        encrypted_payload = E_AEs(payload_bytes.hex())

        proxy = get_next_proxy()
        current_proxy_url = proxy['http'] if proxy else 'Direct Connection'
        print(f"{get_random_color()}Using: {current_proxy_url}{Colors.RESET}")

        response = requests.post(
            url, headers=headers, data=encrypted_payload, verify=False, timeout=30, proxies=proxy)

        if response.status_code == 200:
            print_success(f"MajorRegister successful: {name}")

            login_result = perform_major_login(
                uid, password, access_token, open_id, region, is_ghost)
            account_id = login_result.get("account_id", "N/A")
            jwt_token = login_result.get("jwt_token", "")

            if not is_ghost and jwt_token and account_id != "N/A" and region.upper() != "BR":
                region_bound = force_region_binding(region, jwt_token)
                if region_bound:
                    print_success(f"Region {region} bound successfully!")
                else:
                    print_warning(f"Region binding failed for {region}")

            account_data = {
                "uid": uid,
                "password": password,
                "name": name,
                "region": "GHOST" if is_ghost else region,
                "status": "success",
                "account_id": account_id,
                "jwt_token": jwt_token
            }

            return account_data
        else:
            if proxy and response.status_code >= 500:
                mark_proxy_failed(proxy['http'])
                print_warning(
                    f"Proxy marked as failed due to server error: {response.status_code}")
            else:
                print_warning(
                    f"MajorRegister returned status: {response.status_code}")
            return None

    except requests.exceptions.RequestException as e:
        if proxy:
            mark_proxy_failed(proxy['http'])
            print_warning(
                f"Proxy connection failed and removed: {str(e)[:80]}...")
        else:
            print_warning(f"Major_Regsiter connection error: {str(e)}")
        smart_delay()
        return None

    except Exception as e:
        print_warning(f"Major_Regsiter error: {str(e)}")
        smart_delay()
        return None


def perform_major_login(uid, password, access_token, open_id, region, is_ghost=False):
    """ORIGINAL perform_major_login function - PRESERVED"""
    try:
        lang = "pt" if is_ghost else REGION_LANG.get(region.upper(), "en")
        lang_b = lang.encode("ascii")

        if is_ghost:
            url = "https://loginbp.ggblueshark.com/MajorLogin"
        elif region.upper() in ["ME", "TH"]:
            url = "https://loginbp.common.ggbluefox.com/MajorLogin"
        else:
            url = "https://loginbp.ggblueshark.com/MajorLogin"

        headers = {
            "Accept-Encoding": "gzip",
            "Authorization": "Bearer",
            "Connection": "Keep-Alive",
            "Content-Type": "application/x-www-form-urlencoded",
            "Expect": "100-continue",
            "Host": "loginbp.ggblueshark.com" if is_ghost or region.upper() not in ["ME", "TH"] else "loginbp.common.ggbluefox.com",
            "ReleaseVersion": "Ob51",
            "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 9; ASUS_I005DA Build/PI)",
            "X-GA": "v1 1",
            "X-Unity-Version": "2018.4.11f1"
        }

        payload = b'\x1a\x132025-08-30 05:19:21"\tfree fire(\x01:\x081.114.13B2Android OS 9 / API-28 (PI/rel.cjw.20220518.114133)J\x08HandheldR\nATM MobilsZ\x04WIFI`\xb6\nh\xee\x05r\x03300z\x1fARMv7 VFPv3 NEON VMH | 2400 | 2\x80\x01\xc9\x0f\x8a\x01\x0fAdreno (TM) 640\x92\x01\rOpenGL ES 3.2\x9a\x01+Google|dfa4ab4b-9dc4-454e-8065-e70c733fa53f\xa2\x01\x0e105.235.139.91\xaa\x01\x02'+lang_b + \
            b'\xb2\x01 1d8ec0240ede109973f3321b9354b44d\xba\x01\x014\xc2\x01\x08Handheld\xca\x01\x10Asus ASUS_I005DA\xea\x01@afcfbf13334be42036e4f742c80b956344bed760ac91b3aff9b607a610ab4390\xf0\x01\x01\xca\x02\nATM Mobils\xd2\x02\x04WIFI\xca\x03 7428b253defc164018c604a1ebbfebdf\xe0\x03\xa8\x81\x02\xe8\x03\xf6\xe5\x01\xf0\x03\xaf\x13\xf8\x03\x84\x07\x80\x04\xe7\xf0\x01\x88\x04\xa8\x81\x02\x90\x04\xe7\xf0\x01\x98\x04\xa8\x81\x02\xc8\x04\x01\xd2\x04=/data/app/com.dts.freefireth-PdeDnOilCSFn37p1AH_FLg==/lib/arm\xe0\x04\x01\xea\x04_2087f61c19f57f2af4e7feff0b24d9d9|/data/app/com.dts.freefireth-PdeDnOilCSFn37p1AH_FLg==/base.apk\xf0\x04\x03\xf8\x04\x01\x8a\x05\x0232\x9a\x05\n2019118692\xb2\x05\tOpenGLES2\xb8\x05\xff\x7f\xc0\x05\x04\xe0\x05\xf3F\xea\x05\x07android\xf2\x05pKqsHT5ZLWrYljNb5Vqh//yFRlaPHSO9NWSQsVvOmdhEEn7W+VHNUK+Q+fduA3ptNrGB0Ll0LRz3WW0jOwesLj6aiU7sZ40p8BfUE/FI/jzSTwRe2\xf8\x05\xfb\xe4\x06\x88\x06\x01\x90\x06\x01\x9a\x06\x014\xa2\x06\x014\xb2\x06"GQ@O\x00\x0e^\x00D\x06UA\x0ePM\r\x13hZ\x07T\x06\x0cm\\V\x0ejYV;\x0bU5'

        data = payload
        data = data.replace(
            b'afcfbf13334be42036e4f742c80b956344bed760ac91b3aff9b607a610ab4390', access_token.encode())
        data = data.replace(
            b'1d8ec0240ede109973f3321b9354b44d', open_id.encode())

        d = encrypt_api(data.hex())
        final_payload = bytes.fromhex(d)

        response = requests.post(url, headers=headers,
                                 data=final_payload, verify=False, timeout=30)

        if response.status_code == 200 and len(response.text) > 10:
            jwt_start = response.text.find("eyJ")
            if jwt_start != -1:
                jwt_token = response.text[jwt_start:]
                second_dot = jwt_token.find(".", jwt_token.find(".") + 1)
                if second_dot != -1:
                    jwt_token = jwt_token[:second_dot + 44]

                    account_id = decode_jwt_token(jwt_token)
                    return {"account_id": account_id, "jwt_token": jwt_token}

        return {"account_id": "N/A", "jwt_token": ""}
    except Exception as e:
        print_warning(f"MajorLogin failed: {e}")
        return {"account_id": "N/A", "jwt_token": ""}


def force_region_binding(region, jwt_token):
    """ORIGINAL force_region_binding function - PRESERVED"""
    try:
        if region.upper() in ["ME", "TH"]:
            url = "https://loginbp.common.ggbluefox.com/ChooseRegion"
        else:
            url = "https://loginbp.ggblueshark.com/ChooseRegion"

        if region.upper() == "CIS":
            region_code = "RU"
        else:
            region_code = region.upper()

        fields = {1: region_code}
        proto_data = CrEaTe_ProTo(fields)
        encrypted_data = encrypt_api(proto_data.hex())
        payload = bytes.fromhex(encrypted_data)

        headers = {
            'User-Agent': "Dalvik/2.1.0 (Linux; U; Android 12; M2101K7AG Build/SKQ1.210908.001)",
            'Connection': "Keep-Alive",
            'Accept-Encoding': "gzip",
            'Content-Type': "application/x-www-form-urlencoded",
            'Expect': "100-continue",
            'Authorization': f"Bearer {jwt_token}",
            'X-Unity-Version': "2018.4.11f1",
            'X-GA': "v1 1",
            'ReleaseVersion': "Ob51"
        }

        response = requests.post(
            url, data=payload, headers=headers, verify=False, timeout=30)
        return response.status_code == 200
    except Exception as e:
        print_warning(f"Region binding failed: {e}")
        return False


def smart_delay():
    """ORIGINAL smart_delay function - PRESERVED"""
    time.sleep(random.uniform(1, 2))

# ===============================
# MAIN BOT SETUP
# ===============================


def main():
    """Start the bot"""
    display_banner()

    # Configure advanced HTTPXRequest with better timeout and connection handling
    # This prevents httpx.ConnectError and telegram.error.TimedOut crashes
    try:
        import httpx
        req = HTTPXRequest(
            connection_pool_size=50,  # Increased connection pool
            read_timeout=60.0,        # Increased read timeout
            write_timeout=60.0,       # Increased write timeout
            connect_timeout=20.0,     # Connection timeout
            pool_timeout=60.0,        # Pool timeout
            http_version="HTTP/1.1",  # Use HTTP/1.1 for compatibility
            limits=httpx.Limits(
                max_connections=50,
                max_keepalive_connections=20,
                keepalive_expiry=30.0
            )
        )
    except Exception as e:
        print(f"[WARNING] Could not configure advanced HTTPXRequest: {e}")
        print("[WARNING] Using default HTTPXRequest configuration")
        req = HTTPXRequest(
            connection_pool_size=50,
            read_timeout=60.0,
            write_timeout=60.0,
            connect_timeout=20.0,
            pool_timeout=60.0
        )

    # Create application with the custom request configuration
    application = Application.builder().token(
        TELEGRAM_BOT_TOKEN).request(req).build()

    # Add handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(button_handler))
    application.add_handler(MessageHandler(
        filters.TEXT & ~filters.COMMAND, handle_generation_params))
    os.system('cls') if os.name == 'nt' else os.system('clear')
    print(render('ZEXXY', colors=['white', 'red'], align='center'))
    # Start bot
    print("🤖 Telegram Bot is running...")
    print("🎯 Use /start in Telegram to begin!")
    print(
        f"🔄 Default Proxy Mode: {'✅ ENABLED' if USE_PROXIES else '❌ DISABLED'}")
    print(f"⚡ Target Speed: 8+ accounts/second")
    print(f"👥 Max Workers: {MAX_WORKERS}")
    print(f"🔥 ULTRA TURBO MODE: ACTIVATED")
    application.run_polling(timeout=30)


if __name__ == "__main__":

    os.system('cls') if os.name == 'nt' else os.system('clear')
    print(render('ZEXXY', colors=['white', 'red'], align='center'))
    print("📦 Checking and installing requirements...")

    # Verify proxies on startup
    print("🔄 Verifying proxies...")
    working = verify_all_proxies()
    print(f"✅ {len(working)} proxies working")

    # Start the bot
    main()
