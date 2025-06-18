現状未実装となっている部分について

●auth.py(app配下)
・認証用のテーブルが存在しない

●auth.py(routers配下)
・以下のパスワード初期化の処理
@router.post("/reset-password")
def reset_password(
    email: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Password recovery
    """
    user = get_user_by_email(db, email=email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist in the system.",
        )
    
    # In a real application, you would:
    # 1. Generate a password reset token
    # 2. Send an email with a link to reset password
    # 3. Create an endpoint to handle the password reset
    
    return {"message": "Password reset email sent"}

●business_plans.py
以下のプログラムについて、TODOの参加希望のデータベース登録ロジックの追加が必要
@router.post("/business_plans/{business_plan_id}/apply", response_model=BusinessPlanResponse) # 仮の参加希望エンドポイント
async def apply_to_plan(
    business_plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    ユーザーがビジネスプランに参加希望を送信するエンドポイント
    """
    business_plan = db.query(BusinessPlan).filter(BusinessPlan.id == business_plan_id).first()
    if not business_plan:
        raise HTTPException(status_code=404, detail="Business plan not found")

    # TODO: ここに実際の「参加希望」をデータベースに保存するロジックを追加
    # 例: ApplicationModel(user_id=current_user.id, business_plan_id=business_plan_id) を作成し保存

    # 1. 通知をデータベースに保存（オフラインユーザー向け）
    notification_message_text = (
        f"{current_user.full_name}さんがあなたのビジネスプラン「{business_plan.title}」に"
        f"参加を希望しました。連絡を取ってみましょう！"
    )

●schemas.py
この部分のテーブル定義ができていない
# Create schemas
class UserCreate(UserBase):
    password: str

class BusinessPlanCreate(BusinessPlanBase):
    pass

class PoCPlanCreate(PoCPlanBase):
    pass

class VoteCreate(VoteBase):
    pass

class TeamMemberCreate(TeamMemberBase):
    pass

●business_plans.py
以下の部分について、すでに投票されている場合に例外処理を流すのではなく、投票データを消去して、
画面側の表示を変えるようにする（画面側についてHooksを使ってレンダリングされている場合はあえて処理を追記する必要はないかも）

    # Check if user has already voted for this business plan
    existing_vote = db.query(Vote).filter(
        Vote.user_id == current_user.id,
        Vote.business_plan_id == business_plan_id
    ).first()
    
    if existing_vote:
        raise HTTPException(status_code=400, detail="You have already voted for this business plan")

