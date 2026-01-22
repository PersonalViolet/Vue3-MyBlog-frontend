import request from "@/utils/request";
import { ApiPrefixConstant, VersionConstant } from "@/api/Constant";

interface UploadResponse {
  url: string;
  fileId: string;
}

/** 上传文件 */
export function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  return request({
    url: ApiPrefixConstant.FILE + VersionConstant.V1 + '/uploadfile',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}