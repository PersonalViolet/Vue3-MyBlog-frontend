import request from "@/utils/request";
import CryptoJS from "crypto-js";

interface LoginData {
  account: string;
  password: string;
  remember: boolean;
}

/** 登录请求 */
export function login(data: LoginData) {
  // 构造表单数据
  const params = new URLSearchParams();
  // 在密码传输前进行加密
  const hashedPassword: string = CryptoJS.SHA256(data.password).toString()
  params.append('account', data.account);
  params.append('password', hashedPassword);
  params.append('remenber', data.remember.toString());
  return request({
    url: '/user/Login',
    method: 'post',
    data: params,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
}