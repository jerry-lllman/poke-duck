import { Form, Input, Modal, ModalProps, Select, notification } from "antd";
import { invoke } from "@tauri-apps/api/core";
import { useMount, useSetState, useUpdateEffect } from "ahooks";

const { Item: FormItem } = Form

type ProjectInfoProps = Omit<ModalProps, 'onOk'> & {
  initialValues?: IProjectInfo;
  disabled?: boolean;
  onOk: (values: IProjectInfo) => void;
}

export interface IProjectInfo {
  id?: string;
  projectName: string;
  projectPath: string;
  editor: string;
  terminal: string;
  startCommand?: string;
}


interface Application {
  name: string;
  path: string,
  icon: string,
  executeName: string,
}

interface Applications {
  terminals: Application[],
  editors: Application[]

}

export default function ProjectInfo(props: ProjectInfoProps) {
  const {
    initialValues = {
      projectName: "",
      projectPath: "",
      editor: "",
      terminal: "",
      startCommand: "pnpm install"
    },
    disabled,
    onOk,
    ...restProps
  } = props

  const [form] = Form.useForm<IProjectInfo>();

  useUpdateEffect(() => {
    if (props.open && initialValues) form.setFieldsValue(initialValues)
  }, [props.open, initialValues])

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
        // console.log(terminals, editors)
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
      forceRender
      okButtonProps={{ autoFocus: true, htmlType: 'submit' }}
      modalRender={(dom) => (
        <Form
          layout="horizontal"
          name="form_in_modal"
          form={form}
          disabled={disabled}
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 16 }}
          clearOnDestroy
          initialValues={initialValues}
          onFinish={onOk}
        >
          {dom}
        </Form>
      )}
      {...restProps}
    >
      <FormItem
        required
        name="projectName"
        label="项目名称"
        rules={[{ required: true, message: "请输入项目名称" }]}
      >
        <Input />
      </FormItem>
      <FormItem
        required
        label="项目地址"
        name="projectPath"
        validateTrigger="onBlur"
        rules={[{ required: true, message: "请输入项目地址" }, { validator: validateProjectPath }]}
      >
        <Input />
      </FormItem>
      <FormItem
        required
        label="编辑器"
        name="editor"
        rules={[{ required: true, message: "请选择编辑器" }]}
      >
        <Select
          options={applications.editors.map(item => ({ label: item.name, value: item.executeName }))}
        />
      </FormItem>
      <FormItem
        label="终端工具"
        name="terminal"
        required
        rules={[{ required: true, message: "请选择终端工具" }]}
      >
        <Select
          options={applications.terminals.map(item => ({ label: item.name, value: item.executeName }))}
        />
      </FormItem>
      <FormItem
        label="启动命令配置"
        name="startCommand"
      >
        <Input.TextArea placeholder="eg: pnpm build
      pnpm start" />
      </FormItem>
    </Modal>
  )
}