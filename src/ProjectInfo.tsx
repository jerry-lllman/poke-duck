import { Form, Input, Modal, ModalProps, Select, notification } from "antd";
import { invoke } from "@tauri-apps/api/core";
import { useMount, useSetState } from "ahooks";

const { Item: FormItem } = Form

type ProjectInfoProps = Omit<ModalProps, 'onOk'> & {
  onOk: (values: IProjectInfo) => void;
}

export interface IProjectInfo {
  id?: string;
  projectName: string;
  projectPath: string;
  editor_exec_path: string;
  terminal_exec_path: string;
}


interface Application {
  name: string;
  path: string,
  icon: string,
  execute_path: string,
}

interface Applications {
  terminals: Application[],
  editors: Application[]

}

export default function ProjectInfo(props: ProjectInfoProps) {
  const [form] = Form.useForm();
  const { onOk, ...restProps } = props

  const validateProjectPath = async (_: any, value: string) => {
    if (!value) {
      return Promise.resolve()
    }
    try {
      const res = await invoke("validate_project_path", { projectPath: value })
      if (res) {
        return Promise.resolve()
      } else {
        return Promise.reject("项目不存在，请检查")
      }
    } catch (error) {
      console.error(error)
    }
  }


  const [applications, setApplications] = useSetState<Applications>({
    terminals: [],
    editors: []
  })

  useMount(() => {
    const getApplications = async () => {
      try {
        const results = await Promise.all([
          invoke<Application[]>("get_terminal_applications"),
          invoke<Application[]>("get_editor_applications")
        ])
        const [terminals, editors] = results
        console.log(terminals, editors)
        setApplications({
          terminals,
          editors
        })

      } catch (error) {
        notification.error({
          message: '获取应用列表失败',
        })
      }
    }

    getApplications()
  })

  return (
    <Modal
      title="添加项目"
      destroyOnClose
      okButtonProps={{ autoFocus: true, htmlType: 'submit' }}
      modalRender={(dom) => (
        <Form
          layout="vertical"
          name="form_in_modal"
          form={form}
          clearOnDestroy
          initialValues={{
            projectName: "",
            projectPath: ""
          }}
          onFinish={onOk}
        >
          {dom}
        </Form>
      )}
      {...restProps}
    >
      <FormItem name="projectName" label="项目名称" required rules={[{ required: true, message: "请输入项目名称" }]} >
        <Input />
      </FormItem>
      <FormItem label="项目地址" name="projectPath" required validateTrigger="onBlur" rules={[{ required: true, message: "请输入项目地址" }, { validator: validateProjectPath }]}>
        <Input />
      </FormItem>
      <FormItem label="编辑器" name="editor_exec_path" required rules={[{ required: true, message: "请选择编辑器" }]}>
        <Select
          options={applications.editors.map(item => ({ label: item.name, value: item.execute_path }))}
        />
      </FormItem>
      <FormItem label="终端工具" name="terminal_exec_path" required rules={[{ required: true, message: "请选择终端工具" }]}>
        <Select
          options={applications.terminals.map(item => ({ label: item.name, value: item.execute_path }))}
        />
      </FormItem>
    </Modal>
  )
}