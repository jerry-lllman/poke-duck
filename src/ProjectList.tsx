import { Flex, Table, TableColumnsType } from "antd";
import { IProjectInfo } from "./ProjectInfo";
import { CodeOutlined, DeleteOutlined, SendOutlined, SettingOutlined } from "@ant-design/icons";
import { invoke } from "@tauri-apps/api/core";

interface ProjectListProps {
  dataSource: IProjectInfo[]
  getDataSource: () => void
  editProject: (id: string) => void
}

const ICON_STYLE: React.CSSProperties = { fontSize: 18, cursor: 'pointer' }

export default function ProjectList(props: ProjectListProps) {

  const { dataSource, getDataSource, editProject } = props

  const runCommand = async (command = '', args?: string[]) => {
    debugger
    await invoke('run_command', { command, args })

    // 更新状态
    // Q1：能否做到检测应用程序是否已经关闭？
    // Q2：能否做到检测应用程序当前打开了这个项目？
  }

  // 使用编辑器打开项目
  const openProjectWithEditor = async (id: string) => {
    const projectInfo = dataSource.find(item => item.id === id)!
    await runCommand(projectInfo.editor, [projectInfo.projectPath])

  }

  // 使用终端打开项目
  const openProjectWithTerminal = async (id: string) => {
    // const projectInfo = dataSource.find(item => item.id === id)!
    // await runCommand(projectInfo.terminal, [projectInfo.projectPath])
    // open_terminal_by_project_id
    await invoke('open_terminal_by_project_id', { id })
  }

  const editProjectById = (id: string) => {
    editProject(id)
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
          <SettingOutlined style={ICON_STYLE} onClick={() => editProjectById(id)} />
          <DeleteOutlined style={ICON_STYLE} onClick={() => removeProject(id)} />
        </Flex>
      )
    }
  ]

  return (
    <div>
      <div>

      </div>
      <Table<IProjectInfo>
        rowKey="id"
        columns={columns}
        dataSource={dataSource}
      />
    </div>
  )
}