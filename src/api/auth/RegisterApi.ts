// // src/api/auth/Register.ts
// import request from "@/utils/request";
// import CryptoJS from "crypto-js";
// import { ApiPrefixConstant, VersionConstant } from "../constants";

// interface RegisterData {
//   username: string;
//   account: string;
//   email: string;
//   password: string;
//   registerKey: string;
//   avatarUrl: string;
// }

// /** 注册请求 */
// export function register(data: RegisterData) {
//   // 密码加密
//   const hashedPassword: string = CryptoJS.SHA256(data.password).toString();
  
//   // 构造请求数据
//   const requestData = {
//     username: data.username,
//     account: data.account,
//     email: data.email,
//     password: hashedPassword,
//     registerKey: data.registerKey,
//     avatarUrl: data.avatarUrl
//   };

//     //使用 JSON 传输
//     return request({
//       url: ApiPrefixConstant.AUTH + VersionConstant.V1 + '/register',
//       method: 'post',
//       data: requestData,
//       headers: {
//         'Content-Type': 'application/json'
//       }
//     });
// }


// src/api/auth/Register.ts
import request from "@/utils/request";
import CryptoJS from "crypto-js";
import { ApiPrefixConstant, VersionConstant } from "../Constant";

interface RegisterData {
  username: string;
  account: string;
  email: string;
  password: string;
  registerKey: string;
  avatarUrl: string;
  avatarFile?: File | null; // 新增头像文件字段
}

/** 注册请求 */
export function register(data: RegisterData) {
  // 密码加密
  const hashedPassword: string = CryptoJS.SHA256(data.password).toString();
  
  // 构造用户信息 JSON
  const userRegisterDtoJson = {
    username: data.username,
    account: data.account,
    email: data.email,
    password: hashedPassword,
    registerKey: data.registerKey,
    avatarUrl: data.avatarUrl
  };

  // 创建 FormData 对象
  const formData = new FormData();
  
  // 添加用户信息 JSON
  const userInfoBlob = new Blob([JSON.stringify(userRegisterDtoJson)], {
    type: 'application/json'
  });
  formData.append('userRegisterDtoJson', userInfoBlob);
  
  // 添加头像文件（如果存在）
  if (data.avatarFile) {
    formData.append('file', data.avatarFile);
  }

  // 使用 multipart/form-data 传输
  return request({
    url: ApiPrefixConstant.AUTH + VersionConstant.V1 + '/register',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}