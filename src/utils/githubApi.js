import { GITHUB_CONFIG } from './githubConfig.js';

/**
 * 获取文件的 SHA（用于更新文件）
 */
export async function getFileSha(owner, repo, path, branch, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // 文件不存在
      }
      const error = await response.json();
      throw new Error(error.message || '获取文件信息失败');
    }
    
    const data = await response.json();
    return data.sha;
  } catch (error) {
    console.error('获取文件 SHA 失败:', error);
    throw error;
  }
}

/**
 * 更新 GitHub 文件
 */
export async function updateGitHubFile(owner, repo, path, content, message, branch, token, sha = null) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  
  const body = {
    message: message,
    content: btoa(unescape(encodeURIComponent(content))), // Base64 编码
    branch: branch
  };
  
  // 如果文件已存在，需要提供 SHA
  if (sha) {
    body.sha = sha;
  }
  
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      let errorMessage = '更新文件失败';
      try {
        const error = await response.json();
        errorMessage = error.message || errorMessage;
      } catch (e) {
        // 如果响应不是JSON，尝试读取文本
        errorMessage = response.statusText || errorMessage;
      }
      
      // 添加更详细的错误信息
      if (response.status === 401) {
        errorMessage = '认证失败：Token无效或已过期';
      } else if (response.status === 403) {
        errorMessage = '权限不足：Token没有repo权限或被限制';
      } else if (response.status === 404) {
        errorMessage = '仓库或文件不存在';
      } else if (response.status === 0 || errorMessage.includes('Failed to fetch')) {
        errorMessage = '网络错误：可能是CORS限制，请使用后端代理';
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('更新 GitHub 文件失败:', error);
    throw error;
  }
}

/**
 * 将配置对象转换为文件内容
 */
export function configToFileContent(config) {
  // 将配置对象转换为 config.js 文件格式
  const content = `const config = ${JSON.stringify(config, null, '\t')}

export default config
`;
  return content;
}

/**
 * 批量提交文件到 GitHub
 */
export async function commitMultipleFilesToGitHub(files, token) {
  const { OWNER, REPO, BRANCH } = GITHUB_CONFIG;
  
  try {
    // 准备所有文件的更新操作
    const fileOperations = [];
    
    for (const file of files) {
      const { path, content, message } = file;
      
      // 获取文件 SHA（如果文件存在）
      let sha = null;
      try {
        sha = await getFileSha(OWNER, REPO, path, BRANCH, token);
      } catch (error) {
        // 文件不存在，sha 保持为 null，将创建新文件
        console.log(`文件 ${path} 不存在，将创建新文件`);
      }
      
      fileOperations.push({
        path,
        content,
        sha,
        message: message || `Update ${path}: ${new Date().toLocaleString('zh-CN')}`
      });
    }
    
    // 批量提交所有文件
    const results = [];
    for (const operation of fileOperations) {
      try {
        const result = await updateGitHubFile(
          OWNER,
          REPO,
          operation.path,
          operation.content,
          operation.message,
          BRANCH,
          token,
          operation.sha
        );
        results.push({ path: operation.path, success: true, result });
      } catch (error) {
        console.error(`提交文件 ${operation.path} 失败:`, error);
        results.push({ path: operation.path, success: false, error: error.message });
        throw error; // 如果任何一个文件失败，抛出错误
      }
    }
    
    return results;
  } catch (error) {
    console.error('批量提交文件到 GitHub 失败:', error);
    throw error;
  }
}

/**
 * 上传图片文件到 GitHub
 */
export async function uploadImageToGitHub(file, filePath, token) {
  const { OWNER, REPO, BRANCH } = GITHUB_CONFIG;
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        // 将文件转换为 Base64
        const base64Content = reader.result.split(',')[1]; // 移除 data:image/...;base64, 前缀
        
        // 获取文件 SHA（如果文件存在）
        let sha = null;
        try {
          sha = await getFileSha(OWNER, REPO, filePath, BRANCH, token);
        } catch (error) {
          // 文件不存在，sha 保持为 null，将创建新文件
          console.log(`文件 ${filePath} 不存在，将创建新文件`);
        }
        
        // 上传文件
        const result = await updateGitHubFile(
          OWNER,
          REPO,
          filePath,
          base64Content,
          `Upload image: ${filePath} - ${new Date().toLocaleString('zh-CN')}`,
          BRANCH,
          token,
          sha
        );
        
        // 返回文件的 GitHub URL
        const fileUrl = result.content.download_url || result.content.html_url;
        resolve(fileUrl);
      } catch (error) {
        console.error('上传图片到 GitHub 失败:', error);
        reject(error);
      }
    };
    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * 提交配置到 GitHub（提交所有相关文件）
 */
export async function commitConfigToGitHub(config, token) {
  const { OWNER, REPO, BRANCH } = GITHUB_CONFIG;
  
  try {
    // 准备要提交的所有文件
    const files = [
      {
        path: 'src/config.js',
        content: configToFileContent(config),
        message: `Update config: ${new Date().toLocaleString('zh-CN')}`
      }
    ];
    
    // 使用批量提交函数
    const results = await commitMultipleFilesToGitHub(files, token);
    
    return results;
  } catch (error) {
    console.error('提交配置到 GitHub 失败:', error);
    throw error;
  }
}

