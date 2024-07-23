import { Flex, Table, TableColumnsType } from "antd";
import { IProjectInfo } from "./ProjectInfo";
import { CodeOutlined, DeleteOutlined, SendOutlined, SettingOutlined } from "@ant-design/icons";
import { invoke } from "@tauri-apps/api/core";

interface ProjectListProps {
  dataSource: IProjectInfo[]
  getDataSource: () => void
}

const ICON_STYLE: React.CSSProperties = { fontSize: 18, cursor: 'pointer' }

export default function ProjectList(props: ProjectListProps) {

  const { dataSource, getDataSource } = props

  const runCommand = async (command = '', args?: string[]) => {
    await invoke('run_command', { command, args })

    // 更新状态
    // Q1：能否做到检测应用程序是否已经关闭？
    // Q2：能否做到检测应用程序当前打开了这个项目？
  }

  // 使用编辑器打开项目
  const openProjectWithEditor = async (id: string) => {
    const projectInfo = dataSource.find(item => item.id === id)!
    await runCommand(projectInfo.editorExecPath, [projectInfo.projectPath])

  }

  // 使用终端打开项目
  const openProjectWithTerminal = async (id: string) => {
    const projectInfo = dataSource.find(item => item.id === id)!
    await runCommand(projectInfo.terminalExecPath, [projectInfo.projectPath])
  }

  // 删除项目
  const removeProject = async (id: string) => {
    await invoke('remove_projects', { ids: [id] })
    getDataSource()
  }

  const columns: TableColumnsType<IProjectInfo> = [
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName'
    },
    {
      title: '项目路径',
      width: '20%',
      dataIndex: 'projectPath',
      key: 'projectPath'
    },
    {
      title: '操作',
      dataIndex: 'id',
      key: 'action',
      render: (id) => (
        <Flex gap="middle">
          <SendOutlined style={ICON_STYLE} onClick={() => openProjectWithEditor(id)} />
          <CodeOutlined style={ICON_STYLE} onClick={() => openProjectWithTerminal(id)} />
          <SettingOutlined style={ICON_STYLE} />
          <DeleteOutlined style={ICON_STYLE} onClick={() => removeProject(id)} />
        </Flex>
      )
    }
  ]

  return (
    <Table<IProjectInfo>
      rowKey="id"
      columns={columns}
      dataSource={dataSource}
    />
  )
}