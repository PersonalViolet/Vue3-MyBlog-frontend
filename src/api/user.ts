import request from "@/utils/request";

interface LoginData {
  account: string;
  password: string;
  remember: boolean;
}

/** 登录请求 */
export function login(data: LoginData) {
  // 构造表单数据
  const params = new URLSearchParams();
  params.append('account', data.account);
  params.append('password', data.password);
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