package com.kob.backend.biz.user;

import java.util.Date;
import java.util.List;

import javax.annotation.Resource;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.kob.backend.controller.user.vo.AccountReqVO;
import com.kob.backend.controller.user.vo.AccountRespVO;
import com.kob.backend.controller.user.vo.UserRespVO;
import com.kob.backend.dataobject.UserDO;
import com.kob.backend.security.UserDetailsImpl;
import com.kob.backend.service.UserService;
import com.kob.backend.utils.JwtUtil;

@Service
public class UserBizImpl implements UserBiz {
    @Resource
    private AuthenticationManager authenticationManager;
    @Resource
    private UserService userService;
    @Resource
    private PasswordEncoder passwordEncoder;

    @Override
    public AccountRespVO getToken(AccountReqVO accountReqVO) {
        UsernamePasswordAuthenticationToken authenticationToken =
            new UsernamePasswordAuthenticationToken(accountReqVO.getUsername(), accountReqVO.getPassword());
        // 登录失败，会自动处理
        Authentication authenticate = authenticationManager.authenticate(authenticationToken);
        UserDetailsImpl loginUser = (UserDetailsImpl)authenticate.getPrincipal();
        UserDO user = loginUser.getUser();
        String jwt = JwtUtil.createJWT(user.getId().toString());

        return new AccountRespVO().setToken(jwt);
    }

    @Override
    public String register(AccountReqVO accountReqVO) {
        String username = accountReqVO.getUsername(), password = accountReqVO.getPassword(),
            reenteredPassword = accountReqVO.getReenteredPassword();
        if (!password.equals(reenteredPassword)) {
            return "两次输入的密码不一致";
        }
        List<UserDO> list = userService.list(Wrappers.<UserDO>lambdaQuery().eq(UserDO::getUsername, username));
        if (!list.isEmpty()) {
            return "用户已存在";
        }
        String encodedPassword = passwordEncoder.encode(password);
        UserDO user =
            new UserDO().setUsername(username).setName("haahahha").setPassword(password).setCreateTime(new Date());
        userService.save(user);

        return null;
    }

    @Override
    public UserRespVO getUserInfo() {
        UsernamePasswordAuthenticationToken authentication =
            (UsernamePasswordAuthenticationToken)SecurityContextHolder.getContext().getAuthentication();

        UserDetailsImpl loginUser = (UserDetailsImpl)authentication.getPrincipal();
        UserDO user = loginUser.getUser();
        return new UserRespVO().setId(user.getId()).setUsername(user.getUsername()).setName(user.getName())
            .setAvatar(user.getAvatar()).setCreateTime(user.getCreateTime());
    }
}
