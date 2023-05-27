import { message, Upload, Button, notification } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { Graph } from './typings';

type UploadNodeProps = {
  onUpload: (data: Graph) => void;
};

const UploadGraph: React.FC<UploadNodeProps> = (props) => {
  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/upload',
    showUploadList: false,
    beforeUpload(file) {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => {
        try {
          const graph = JSON.parse(reader.result as string);
          if (props.onUpload) {
            props.onUpload(graph);
          }
        } catch (error) {
          notification.error({
            message: 'Failed to parse file',
            description: 'Please make sure the file is a valid JSON file',
          });
        }
      };
      reader.onerror = (error) => {
        message.error('Failed to read file');
      };

      // Return false to prevent the upload
      return false;
    }
  };

  return (
    <Upload {...uploadProps}>
      <Button icon={<UploadOutlined />}>Upload</Button>
    </Upload>
  )
};

export default UploadGraph;